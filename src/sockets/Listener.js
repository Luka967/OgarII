const WebSocket = require("uws");
const WebSocketServer = WebSocket.Server;

const PlayingRouter = require("../primitives/PlayingRouter");
const Connection = require("./Connection");
const ServerHandle = require("../ServerHandle");

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
            verifyClient: this._verifyClient.bind(this)
        }, this._onOpen.bind(this));
        return true;
    }
    /**
     * @param {Function} callback
     * @returns {Boolean}
     */
    close(callback) {
        if (this.listenerSocket === null) return false;
        this.logger.debug("closing");
        for (let i = 0, l = this.connections.length; i < l; i++)
            this.connections[i].close();
        this.listenerSocket.close(callback);
        this.listenerSocket = null;
        return true;
    }

    _verifyClient(info, response) {
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
    _onOpen() {
        this.logger.inform("listener open");
    }

    /**
     * @param {WebSocket} webSocket
     */
    onConnection(webSocket) {
        this.logger.debug("new connection");
        this.connections.push(new Connection(this, webSocket));
    }

    /**
     * @param {Connection} connection
     * @param {{code: Number, reason: String}} event
     */
    onDisconnection(connection, event) {
        this.logger.debug(`disconnection (${event.code} '${event.reason}')`);
        this.connections.splice(this.connections.indexOf(connection), 1);
    }

    update() {
        
    }
}

module.exports = Listener;