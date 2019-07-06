const WebSocket = require("uws");
const WebSocketServer = WebSocket.Server;

const Connection = require("./Connection");
const ChatChannel = require("./ChatChannel");
const { filterIPAddress } = require("../primitives/Misc");

class Listener {
    /**
     * @param {ServerHandle} handle
     */
    constructor(handle) {
        /** @type {WebSocketServer} */
        this.listenerSocket = null;
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

    open() {
        if (this.listenerSocket !== null) return false;
        this.logger.debug(`listener opening at ${this.settings.listeningPort}`);
        this.listenerSocket = new WebSocketServer({
            port: this.settings.listeningPort,
            verifyClient: this.verifyClient.bind(this)
        }, this.onOpen.bind(this));
        this.listenerSocket.on("connection", this.onConnection.bind(this));
        return true;
    }
    close() {
        if (this.listenerSocket === null) return false;
        this.logger.debug("listener closing");
        this.listenerSocket.close();
        this.listenerSocket = null;
        return true;
    }

    /**
     * @param {{req: any, origin: string}} info
     * @param {*} response
     */
    verifyClient(info, response) {
        const address = filterIPAddress(info.req.socket.remoteAddress);
        this.logger.onAccess(`REQUEST FROM ${address}, ${info.secure ? "" : "not "}secure, Origin: ${info.origin}`);
        if (this.connections.length > this.settings.listenerMaxConnections) {
            this.logger.debug("listenerMaxConnections reached, dropping new connections");
            return void response(false, 503, "Service Unavailable");
        }
        const acceptedOrigins = this.settings.listenerAcceptedOrigins;
        if (acceptedOrigins.length > 0 && acceptedOrigins.indexOf(info.origin) === -1) {
            this.logger.debug(`listenerAcceptedOrigins doesn't contain ${info.origin}`);
            return void response(false, 403, "Forbidden");
        }
        if (this.settings.listenerForbiddenIPs.indexOf(address) !== -1) {
            this.logger.debug(`listenerForbiddenIPs contains ${address}, dropping connection`);
            return void response(false, 403, "Forbidden");
        }
        if (this.settings.listenerMaxConnectionsPerIP > 0) {
            const count = this.connectionsByIP[address];
            if (count && count >= this.settings.listenerMaxConnectionsPerIP) {
                this.logger.debug(`listenerMaxConnectionsPerIP reached for '${address}', dropping its new connections`);
                return void response(false, 403, "Forbidden");
            }
        }
        this.logger.debug("client verification passed");
        response(true);
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
     * @param {WebSocket} webSocket
     */
    onConnection(webSocket) {
        const newConnection = new Connection(this, webSocket);
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
