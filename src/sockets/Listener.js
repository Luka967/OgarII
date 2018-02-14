const WebSocket = require("uws");
const WebSocketServer = WebSocket.Server;

const Connection = require("./Connection");
const ChatChannel = require("./ChatChannel");

class Listener {
    /**
     * @param {ServerHandle} handle
     */
    constructor(handle) {
        /** @type {WebSocketServer} */
        this.listenerSocket = null;
        this.handle = handle;
        this.globalChat = new ChatChannel(this);

        /** @type {PlayingRouter[]} */
        this.allPlayingRouters = [];
        /** @type {Connection[]} */
        this.connections = [];
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
        this.logger.debug("closing");
        for (let i = 0, l = this.connections.length; i < l; i++)
            this.connections[i].close();
        this.listenerSocket.close();
        this.listenerSocket = null;
        return true;
    }

    verifyClient(info, response) {
        this.logger.onAccess(`REQUEST FROM ${info.req.socket.remoteAddress}, ${info.secure ? "" : "not "}secure, Origin: ${info.origin}`);
        if (this.settings.listenerAcceptedOrigins !== null) {
            const split = this.settings.listenerAcceptedOrigins.split(" ");
            let matches = false;
            for (let i = 0, l = split.length; i < l; i++)
                if (info.origin === split[i]) { matches = true; break; }
            this.logger.debug(`socketAcceptedOrigins is defined; did ${info.origin} pass: ${matches}`);
            if (!matches) return void response(false, 403, "Forbidden");
        }
        if (this.connections.length > this.settings.listenerMaxConnections) {
            this.logger.debug("too many connections, drop new ones!");
            return void response(false, 503, "Service Unavailable");
        }
        // TODO: IP checks
        this.logger.debug("client verification passed");
        response(true);
    }
    onOpen() {
        this.logger.inform("listener open");
    }

    /**
     * @param {WebSocket} webSocket
     */
    onConnection(webSocket) {
        const newConnection = new Connection(this, webSocket);
        this.logger.onAccess(`CONNECTION FROM ${newConnection.remoteAddress}`);
        newConnection.createPlayer();
        this.connections.push(newConnection);
        this.globalChat.add(newConnection);
        // DEBUG
        this.handle.worlds[1].addPlayer(newConnection.player);
    }

    /**
     * @param {Connection} connection
     * @param {Number} code
     * @param {String} reason
     */
    onDisconnection(connection, code, reason) {
        this.logger.onAccess(`DISCONNECTION FROM ${connection.remoteAddress} (${code} '${reason}')`);
        this.globalChat.remove(connection);
        this.connections.splice(this.connections.indexOf(connection), 1);
    }

    update() {
        let i, l;
        for (i = 0, l = this.connections.length; i < l; i++)
            this.connections[i].sendUpdate();
    }
}

module.exports = Listener;

const PlayingRouter = require("../primitives/PlayingRouter");
const ServerHandle = require("../ServerHandle");