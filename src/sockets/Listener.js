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

    open() {
        console.debug("Listener.open call");
        this.listenerSocket = new WebSocketServer({
            port: this.settings.socketPort,
            verifyClient: this._verifyClient.bind(this)
        }, this._onOpen.bind(this));
    }
    _verifyClient(info, response) {
        console.debug("client verification called");
        if (this.settings.socketAcceptedOrigins !== null) {
            const split = this.settings.socketAcceptedOrigins.split(" ");
            let matches = false;
            for (let i = 0, l = split.length; i < l; i++)
                if (info.origin === split) { matches = true; break; }
            console.debug(`socketAcceptedOrigins is defined; did pass: ${matches}`);
            if (!matches) return void response(false, 400, "Bad Request");
        }
        // TODO: check IPs
    }
    _onOpen() {
        console.debug("listener open");
    }

    /**
     * @param {WebSocket} webSocket
     */
    onConnection(webSocket) {
        console.debug("new connection");
        this.connections.push(new Connection(this, webSocket));
    }

    /**
     * @param {Connection} connection
     * @param {{code: Number, reason: String}} event
     */
    onDisconnection(connection, event) {
        console.debug(`disconnection (${event.code} '${event.reason}')`);
        this.connections.splice(this.connections.indexOf(connection), 1);
    }
}

module.exports = Listener;