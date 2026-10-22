const uWS = require("uWebSockets.js");
const fs = require("fs");
const path = require("path");
const tls = require("tls");
const { X509Certificate } = require("crypto");

const Connection = require("./Connection");
const ChatChannel = require("./ChatChannel");
const { filterIPAddress } = require("../primitives/Misc");

function remoteAddress(res) {
    const raw = Buffer.from(res.getRemoteAddress());
    // uWebSockets.js may represent IPv4 clients as IPv4-mapped IPv6 addresses.
    if (raw.length === 4 || (raw.length === 16 &&
        raw.subarray(0, 10).every(byte => byte === 0) &&
        raw[10] === 0xFF && raw[11] === 0xFF))
        return Array.from(raw.subarray(raw.length - 4)).join(".");
    const address = Buffer.from(res.getRemoteAddressAsText()).toString();
    return filterIPAddress(new URL(`http://[${address}]`).hostname.slice(1, -1));
}

class Listener {
    /**
     * @param {ServerHandle} handle
     */
    constructor(handle) {
        /** @type {import("uWebSockets.js").TemplatedApp} */
        this.listenerSocket = null;
        this.listenSocket = null;
        this.secure = false;
        this.handle = handle;
        this.globalChat = new ChatChannel(this);

        /** @type {Router[]} */
        this.routers = [];
        /** @type {Connection[]} */
        this.connections = [];
        /** @type {Counter<IPAddress>} */
        this.connectionsByIP = { };
    }

    get settings() { return this.handle.settings; }
    get logger() { return this.handle.logger; }

    tlsOptions() {
        const cert = this.settings.listenerTlsCertPath;
        const key = this.settings.listenerTlsKeyPath;
        if (cert === "" && key === "") return null;
        if (typeof cert !== "string" || !cert.trim() ||
            typeof key !== "string" || !key.trim())
            throw new Error("TLS requires both listenerTlsCertPath and listenerTlsKeyPath");

        const certPath = path.resolve(cert);
        const keyPath = path.resolve(key);
        try {
            const certData = fs.readFileSync(certPath);
            const keyData = fs.readFileSync(keyPath);
            const certificate = new X509Certificate(certData);
            const now = Date.now();
            if (now < Date.parse(certificate.validFrom) || now > Date.parse(certificate.validTo))
                throw new Error("certificate is not currently valid");
            tls.createSecureContext({ cert: certData, key: keyData });
        } catch (error) {
            throw new Error(`Cannot start TLS listener: ${error.message}`);
        }
        return { cert_file_name: certPath, key_file_name: keyPath };
    }

    open() {
        if (this.listenerSocket !== null) return false;
        this.logger.debug(`listener opening at ${this.settings.listeningPort}`);
        const tlsOptions = this.tlsOptions();
        const app = tlsOptions ? uWS.SSLApp(tlsOptions) : uWS.App();
        this.secure = tlsOptions !== null;
        this.listenerSocket = app;
        app.ws("/*", {
            idleTimeout: 0,
            sendPingsAutomatically: false,
            // Match uws's native default; Connection still rejects binary packets over 512 bytes.
            maxPayloadLength: 16 * 1024 * 1024,
            upgrade: (res, req, context) => {
                const address = remoteAddress(res);
                let origin = req.getHeader("origin");
                // The old HTTP server distinguished a missing Origin from an empty one.
                if (origin === "") {
                    let hasOrigin = false;
                    req.forEach(key => { if (key === "origin") hasOrigin = true; });
                    if (!hasOrigin) origin = undefined;
                }
                const rejection = this.verifyClient(address, origin);
                if (rejection) return void res.writeStatus(rejection).end();
                res.upgrade({ address, connection: null },
                    req.getHeader("sec-websocket-key"),
                    req.getHeader("sec-websocket-protocol"),
                    req.getHeader("sec-websocket-extensions"), context);
            },
            open: webSocket => this.onConnection(webSocket),
            message: (webSocket, data, isBinary) =>
                webSocket.getUserData().connection.onSocketMessage(data, isBinary),
            ping: webSocket => webSocket.getUserData().connection.closeSocket(1003, "Unexpected message format"),
            pong: webSocket => webSocket.getUserData().connection.closeSocket(1003, "Unexpected message format"),
            close: (webSocket, code, reason) =>
                webSocket.getUserData().connection.onSocketClose(code, Buffer.from(reason).toString())
        });
        app.listen(this.settings.listeningPort, listenSocket => {
            if (this.listenerSocket !== app) {
                if (listenSocket) uWS.us_listen_socket_close(listenSocket);
                return;
            }
            if (!listenSocket) {
                this.listenerSocket = null;
                this.secure = false;
                this.logger.inform(`listener could not open at ${this.settings.listeningPort}`);
                return;
            }
            this.listenSocket = listenSocket;
            this.onOpen();
        });
        return this.listenerSocket === app;
    }
    close() {
        if (this.listenerSocket === null) return false;
        this.logger.debug("listener closing");
        // uws.Server.close() closed its active sockets without sending a close frame.
        const connections = this.connections.slice();
        for (const connection of connections)
            if (!connection.socketDisconnected)
                connection.onSocketClose(0, "");
        this.listenerSocket.close();
        for (const connection of connections)
            connection.close();
        this.listenSocket = null;
        this.listenerSocket = null;
        this.secure = false;
        return true;
    }

    /**
     * @param {string} address
     * @param {string|undefined} origin
     * @returns {string|null} HTTP status on rejection
     */
    verifyClient(address, origin) {
        this.logger.onAccess(`REQUEST FROM ${address}, ${this.secure ? "" : "not "}secure, Origin: ${origin}`);
        if (this.connections.length > this.settings.listenerMaxConnections) {
            this.logger.debug("listenerMaxConnections reached, dropping new connections");
            return "503 Service Unavailable";
        }
        const acceptedOrigins = this.settings.listenerAcceptedOrigins;
        if (acceptedOrigins.length > 0 && acceptedOrigins.indexOf(origin) === -1) {
            this.logger.debug(`listenerAcceptedOrigins doesn't contain ${origin}`);
            return "403 Forbidden";
        }
        if (this.settings.listenerForbiddenIPs.indexOf(address) !== -1) {
            this.logger.debug(`listenerForbiddenIPs contains ${address}, dropping connection`);
            return "403 Forbidden";
        }
        if (this.settings.listenerMaxConnectionsPerIP > 0) {
            const count = this.connectionsByIP[address];
            if (count && count >= this.settings.listenerMaxConnectionsPerIP) {
                this.logger.debug(`listenerMaxConnectionsPerIP reached for '${address}', dropping its new connections`);
                return "403 Forbidden";
            }
        }
        this.logger.debug("client verification passed");
        return null;
    }
    onOpen() {
        this.logger.inform(`listener open at ${this.settings.listeningPort}`);
    }

    /**
     * @param {Router} router
     */
    addRouter(router) {
        this.routers.push(router);
    }
    /**
     * @param {Router} router
     */
    removeRouter(router) {
        this.routers.splice(this.routers.indexOf(router), 1);
    }

    /**
     * @param {import("uWebSockets.js").WebSocket} webSocket
     */
    onConnection(webSocket) {
        const data = webSocket.getUserData();
        const newConnection = new Connection(this, webSocket, data.address);
        data.connection = newConnection;
        this.logger.onAccess(`CONNECTION FROM ${newConnection.remoteAddress}`);
        this.connectionsByIP[newConnection.remoteAddress] =
            this.connectionsByIP[newConnection.remoteAddress] + 1 || 1;
        this.connections.push(newConnection);
    }

    /**
     * @param {Connection} connection
     * @param {number} code
     * @param {string} reason
     */
    onDisconnection(connection, code, reason) {
        this.logger.onAccess(`DISCONNECTION FROM ${connection.remoteAddress} (${code} '${reason}')`);
        if (--this.connectionsByIP[connection.remoteAddress] <= 0)
            delete this.connectionsByIP[connection.remoteAddress];
        this.globalChat.remove(connection);
        this.connections.splice(this.connections.indexOf(connection), 1);
    }

    update() {
        let i, l;
        for (i = 0, l = this.routers.length; i < l; i++) {
            const router = this.routers[i];
            if (!router.shouldClose) continue;
            router.close(); i--; l--;
        }
        for (i = 0; i < l; i++) this.routers[i].update();
        for (i = 0, l = this.connections.length; i < l; i++) {
            const connection = this.connections[i];
            if (this.settings.listenerForbiddenIPs.indexOf(connection.remoteAddress) !== -1)
                connection.closeSocket(1003, "Remote address is forbidden");
            else if (Date.now() - connection.lastActivityTime >= this.settings.listenerMaxClientDormancy)
                connection.closeSocket(1003, "Maximum dormancy time exceeded");
        }
    }
}

module.exports = Listener;

const Router = require("./Router");
const ServerHandle = require("../ServerHandle");
