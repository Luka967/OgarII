const WebSocket = require("uws");
const WebSocketServer = WebSocket.Server;

const Connection = require("./Connection");

class Listener {
    /**
     * @param {ServerHandle} handle
     */
    constructor(handle) {
        /** @type {WebSocketServer} */
        this.listenerSocket = null;
        this.handle = handle;

        /** @type {PlayingRouter[]} */
        this.allPlayingRouters = [];
        /** @type {Connection[]} */
        this.connections = [];
    }

    get settings() { return this.handle.settings; }
    get logger() { return this.handle.logger; }

    open() {
        if (this.listenerSocket !== null) return false;
        this.logger.debug(`listener opening at ${this.settings.socketPort}`);
        this.listenerSocket = new WebSocketServer({
            port: this.settings.socketPort,
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
        this.logger.debug("client verification called");
        if (this.settings.socketAcceptedOrigins !== null) {
            const split = this.settings.socketAcceptedOrigins.split(" ");
            let matches = false;
            for (let i = 0, l = split.length; i < l; i++)
                if (info.origin === split[i]) { matches = true; break; }
            this.logger.debug(`socketAcceptedOrigins is defined; did ${info.origin} pass: ${matches}`);
            if (!matches) return void response(false, 400, "Bad Request");
        }
        // TODO: check IPs
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
        this.logger.debug(`new connection from ${newConnection.remoteAddress}`);
        this.connections.push(newConnection);
        newConnection.createPlayer();
        // DEBUG
        this.handle.worlds[1].addPlayer(newConnection.player);
    }

    /**
     * @param {Connection} connection
     * @param {Number} code
     * @param {String} reason
     */
    onDisconnection(connection, code, reason) {
        this.logger.debug(`disconnection (${code} '${reason}')`);
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