const Messages = {
    DisplayChatMessage: require("./DisplayChatMessage"),
    GetStats: require("./GetStats"),
    SetNewOwnedCell: require("./SetNewOwnedCell"),
    SetWorldBounds: require("./SetWorldBounds"),
    UpdateLeaderboard: require("./UpdateLeaderboard"),
    UpdatePieBoard: require("./UpdatePieBoard"),
    UpdateTextBoard: require("./UpdateTextBoard"),
    UpdatePosition: require("./UpdatePosition"),
    UpdateVisibleCells: require("./UpdateVisibleCells")
};

const Protocol = require("../Protocol");

class LegacyProtocol extends Protocol {
    /**
     * @param {Connection} connection
     */
    constructor(connection) {
        super(connection);
        this.gotProtocol = false;
        this.protocol = NaN;
        this.goKey = false;
        this.key = NaN;
    }

    /**
     * @param {Reader} reader
     */
    distinguish(reader) {
        if (reader.length < 5) return false;
        if (reader.readUInt8() !== 0xFE) return false;
        this.gotProtocol = true;
        this.protocol = reader.readUInt32();
        if (this.protocol < 4) {
            this.protocol = 4;
            this.logger.debug(`legacy protocol: got version ${this.protocol}, which is lower than 4`);
        }
        return true;
    }

    /**
     * @param {Reader} reader
     */
    onSocketMessage(reader) {
        switch (reader.readUInt8()) {
            case 0:
                const name = readZTString(reader, this.protocol);
                this.spawningName = name.slice(0, this.listener.settings.playerMaxNameLength - 1);
                break;
            case 1: this.connection.requestingSpectate = true; break;
            case 16:
                switch (reader.length) {
                    case 13:
                        this.connection.mouseX = reader.readInt32();
                        this.connection.mouseY = reader.readInt32();
                        break;
                    case 9:
                        this.connection.mouseX = reader.readInt16();
                        this.connection.mouseY = reader.readInt16();
                        break;
                    case 21:
                        this.mouseX = ~~reader.readFloat64();
                        this.mouseY = ~~reader.readFloat64();
                        break;
                    default: return void this.closeSocket(1003, "Unexpected message format");
                }
                break;
            case 17:
                if (this.connection.controllingMinions)
                    for (let i = 0, l = this.connection.minions.length; i < l; i++)
                        this.connection.minions[i].splitAttempts++;
                else this.connection.splitAttempts++;
                break;
            case 18: this.isPressingQ = true; break;
            case 19: this.isPressingQ = this.hasProcessedQ = false; break;
            case 21:
                if (this.connection.controllingMinions)
                    for (let i = 0, l = this.connection.minions.length; i < l; i++)
                        this.connection.minions[i].ejectAttempts++;
                else this.connection.ejectAttempts++;
                break;
            case 22:
                if (!this.settings.minionEnableERTPControls) break;
                for (let i = 0, l = this.connection.minions.length; i < l; i++)
                    this.connection.minions[i].splitAttempts++;
                break;
            case 23:
                if (!this.settings.minionEnableERTPControls) break;
                for (let i = 0, l = this.connection.minions.length; i < l; i++)
                    this.connection.minions[i].ejectAttempts++;
                break;
            case 24:
                if (!this.settings.minionEnableERTPControls) break;
                this.connection.minionsFrozen = !this.connection.minionsFrozen;
                break;
            case 99:
                if (this.connection.player === null) break;
                if (reader.length < 2)
                    return void this.fail(1003, "Bad message format");
                const flags = reader.readUInt8();
                const skipLen = 2 * ((flags & 2) + (flags & 4) + (flags & 8))
                if (reader.length < 2 + skipLen)
                    return void this.fail(1003, "Bad message format");
                reader.skip(skipLen);
                const message = readZTString(reader, this.protocol).trim();
                const globalChat = this.connection.listener.globalChat;
                if (message.length >= 2 && message[0] === "/") {
                    if (!this.connection.listener.handle.chatCommands.execute(this, message.slice(1)))
                        globalChat.directMessage(null, this, "unknown command, execute /help for the list of commands");
                }
                else message && globalChat.broadcast(this, message);
                break;
            case 254:
                if (this.player !== null && this.player.world !== null)
                    this.send(Messages.GetStats(this.player.world.stats, this.protocol));
                break;
            default: return void this.fail(1003, "Unknown message type");
        }
    }

    /**
     * 
     * @param {*} source 
     * @param {*} message 
     */
    onChatMessage(source, message) {
        const writer = new Writer();
        writer.writeUInt8(99);
        writer.writeUInt8(source.isServer * 128);
        writer.writeUInt8(source.color.r);
        writer.writeUInt8(source.color.g);
        writer.writeUInt8(source.color.b);
        writer.writeZTString(source.name, protocol);
        writer.writeZTString(message, protocol);
        this.send(writer.finalize());
    }
}

module.exports = LegacyProtocol;

/**
 * @param {Reader} reader
 * @param {number} protocol
 */
function readZTString(reader, protocol) {
    return reader[protocol < 6 ? "readZTStringUCS2" : "readZTStringUTF8"]();
}

const Connection = require("../../sockets/Connection");
const Reader = require("../../primitives/Reader");