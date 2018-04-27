const Messages = {
    UpdateVisibleCells: require("../messages/UpdateVisibleCells"),
    SetNewOwnedCell: require("../messages/SetNewOwnedCell"),
    SetWorldBounds: require("../messages/SetWorldBounds"),
    UpdatePosition: require("../messages/UpdatePosition"),
    GetStats: require("../messages/GetStats")
};
const PlayingRouter = require("../primitives/PlayingRouter");
const Reader = require("../primitives/Reader");

class Connection extends PlayingRouter {
    /**
     * @param {Listener} listener
     * @param {WebSocket} webSocket
     */
    constructor(listener, webSocket) {
        super(listener);
        this.remoteAddress = webSocket._socket.remoteAddress;
        this.webSocket = webSocket;
        this.lastActivityTime = Date.now();
        
        this.upgradeLevel = 0;
        this.protocol = NaN;
        this.protocolKey = NaN;

        /** @type {Minion[]} */
        this.minions = [];
        this.minionsFrozen = false;
        this.controllingMinions = false;

        webSocket.on("close", this.onClose.bind(this));
        webSocket.on("message", this._onMessage.bind(this));
        webSocket.on("ping", this.closeSocket.bind(webSocket, 1003, "Unexpected message format"));
        webSocket.on("pong", this.closeSocket.bind(webSocket, 1003, "Unexpected message format"));
    }

    get isExternal() { return true; }

    /** @private */
    get logger() { return this.listener.handle.logger; }

    /**
     * @param {Number} code
     * @param {String} reason
     */
    onClose(code, reason) {
        super.close();
        this.isDisconnected = true;
        this.disconnectionTick = this.listener.handle.tick;
        this.listener.onDisconnection(this, code, reason);
        this.webSocket.removeAllListeners();
    }

    /**
     * @param {ArrayBuffer|String} data
     */
    _onMessage(data) {
        if (data instanceof String) return void this.closeSocket(1003, "Unexpected message format");
        if (data.byteLength > 256 || data.byteLength === 0)
            return void this.closeSocket(1009, "Unexpected message size");
        this.lastActivityTime = Date.now();
        const reader = new Reader(Buffer.from(data), 0);
        switch (this.upgradeLevel) {
            case 0:
                if (reader.dataLength !== 5 || reader.readUInt8() !== 0xFE)
                    return void this.closeSocket(1003, "Bad message format");
                this.protocol = reader.readUInt32();
                if (this.protocol < 4) {
                    this.logger.debug(`got non-existent protocol version ${this.protocol}, assuming 4`);
                    this.protocol = 4;
                } else if (this.protocol > 17)
                    return void this.closeSocket(1003, `Unsupported protocol ${this.protocol}`);
                this.upgradeLevel++;
                break;
            case 1:
                if (reader.dataLength !== 5 || reader.readUInt8() !== 0xFF)
                    return void this.closeSocket(1003, "Bad message format");
                this.protocolKey = reader.readUInt32();
                this.upgradeLevel++;
                break;
            case 2:
                if (reader.dataLength < 1) return void this.closeSocket(1003, "Bad message format");
                this._onGameMessage(reader.readUInt8(), reader);
                break;
        }
    }
    /**
     * @param {Number} messageId
     * @param {Reader} reader
     */
    _onGameMessage(messageId, reader) {
        switch (messageId) {
            case 0:
                const name = reader[this.protocol < 6 ? "readZTStringUCS2" : "readZTStringUTF8"]();
                this.spawningName = name.slice(0, this.listener.settings.playerMaxNameLength - 1);
                break;
            case 1: this.requestingSpectate = true; break;
            case 16:
                switch (reader.dataLength) {
                    case 13:
                        this.mouseX = reader.readInt32();
                        this.mouseY = reader.readInt32();
                        break;
                    case 9:
                        this.mouseX = reader.readInt16();
                        this.mouseY = reader.readInt16();
                        break;
                    case 21:
                        this.mouseX = ~~reader.readFloat64();
                        this.mouseY = ~~reader.readFloat64();
                        break;
                    default: return void this.closeSocket(1003, "Unexpected message format");
                }
                break;
            case 17:
                if (this.controllingMinions) for (let i = 0, l = this.minions.length; i < l; i++)
                        this.minions[i].splitAttempts++;
                else this.splitAttempts++;
                break;
            case 18: this.isPressingQ = true; break;
            case 19: this.isPressingQ = this.hasProcessedQ = false; break;
            case 21:
                if (this.controllingMinions) for (let i = 0, l = this.minions.length; i < l; i++)
                        this.minions[i].ejectAttempts++;
                else this.ejectAttempts++;
                break;
            case 22:
                if (!this.listener.settings.minionEnableERTPControls) break;
                for (let i = 0, l = this.minions.length; i < l; i++)
                    this.minions[i].splitAttempts++;
                break;
            case 23:
                if (!this.listener.settings.minionEnableERTPControls) break;
                for (let i = 0, l = this.minions.length; i < l; i++)
                    this.minions[i].ejectAttempts++;
                break;
            case 24:
                if (!this.listener.settings.minionEnableERTPControls) break;
                this.minionsFrozen = !this.minionsFrozen;
                break;
            case 99:
                if (this.player === null) break;
                if (reader.dataLength < 2)
                    return void this.closeSocket(1003, "Bad message format");
                const flags = reader.readUInt8();
                const skipLen = 2 * ((flags & 2) + (flags & 4) + (flags & 8))
                if (reader.dataLength < 2 + skipLen)
                    return void this.closeSocket(1003, "Bad message format");
                reader.skip(skipLen);
                const message = reader.readZTString(this.protocol).trim();
                const globalChat = this.listener.globalChat;
                if (message.length >= 2 && message[0] === "/") {
                    if (!this.listener.handle.chatCommands.execute(this, message.slice(1)))
                        globalChat.directMessage(null, this, "unknown command, execute /help for the list of commands");
                }
                else message && globalChat.broadcast(this, message);
                break;
            case 254:
                if (this.player !== null && this.player.world !== null)
                    this.send(Messages.GetStats(this.player.world.stats, this.protocol));
                break;
            default: return void this.closeSocket(1003, "Unknown message type");
        }
    }

    onQPress() {
        if (this.player === null) return;
        if (this.listener.settings.minionEnableQBasedControl && this.minions.length > 0)
            this.controllingMinions = !this.controllingMinions;
        else this.listener.handle.gamemode.whenPlayerPressQ(this.player);
    }

    update() {
        if (this.isDisconnected || isNaN(this.protocolKey)) return;
        if (this.player === null) return;
        if (this.player.world === null) {
            if (this.spawningName !== null)
                this.listener.handle.matchmaker.toggleQueued(this);
            this.spawningName = null;
            this.splitAttempts = 0;
            this.ejectAttempts = 0;
            this.requestingSpectate = false;
            this.isPressingQ = false;
            this.hasProcessedQ = false;
            return;
        }
        this.player.updateVisibleCells();

        const add = [], upd = [], eat = [], del = [];
        const player = this.player;
        const visible = player.visibleCells,
            lastVisible = player.lastVisibleCells;
        for (let id in visible) {
            const cell = visible[id];
            if (!lastVisible.hasOwnProperty(id)) add.push(cell);
            else if (cell.shouldUpdate) upd.push(cell);
        }
        for (let id in lastVisible) {
            const cell = lastVisible[id];
            if (visible.hasOwnProperty(id)) continue;
            if (cell.eatenBy !== null) eat.push(cell);
            del.push(cell);
        }
        
        if (player.state === 1 || player.state === 2)
            this.send(Messages.UpdatePosition(player.viewArea));
        this.send(Messages.UpdateVisibleCells(this, add, upd, eat, del));
        if (this.listener.handle.tick % 4 === 0)
            this.listener.handle.gamemode.sendLeaderboard(this);
    }

    /**
     * @param {Buffer} data
     */
    send(data) {
        if (this.isDisconnected) return;
        this.webSocket.send(data);
    }

    close() {
        this.closeSocket(1001, "Manual connection close call");
    }
    onWorldSet() {
        this.send(Messages.SetWorldBounds(this.player.world, true, this.protocol));
    }
    /**
     * @param {PlayerCell} cell
     */
    onNewOwnedCell(cell) {
        this.send(Messages.SetNewOwnedCell(cell.id));
    }

    /**
     * @param {Number=} code
     * @param {String=} reason
     */
    closeSocket(code, reason) {
        if (this.isDisconnected) return;
        this.isDisconnected = true;
        this.webSocket.close(code || 1006, reason || "");
    }
}

module.exports = Connection;

const WebSocket = require("uws");
const Listener = require("./Listener");
const Minion = require("../bots/Minion");