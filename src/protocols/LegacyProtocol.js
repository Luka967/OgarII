const Protocol = require("./Protocol");

class LegacyProtocol extends Protocol {
    /**
     * @param {Connection} connection
     */
    constructor(connection) {
        super(connection);
        this.gotProtocol = false;
        this.protocol = NaN;
        this.gotKey = false;
        this.key = NaN;
    }

    /**
     * @param {Reader} reader
     */
    distinguishes(reader) {
        if (reader.length < 5) return false;
        if (reader.readUInt8() !== 254) return false;
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
        const messageId = reader.readUInt8();
        switch (messageId) {
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
                        this.connection.mouseX = ~~reader.readFloat64();
                        this.connection.mouseY = ~~reader.readFloat64();
                        break;
                    default: return void this.fail(1003, "Unexpected message format");
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
                    return void this.fail(1003, "Unexpected message format");
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
                    this.onStatsRequest();
                break;
            case 255:
                if (this.gotKey) return void this.fail("Unexpected message");
                if (reader.length < 5) return void this.fail("Unexpected message format");
                this.key = reader.readUInt32();
                break;
            default:
                console.log(messageId);
                return void this.fail(1003, "Unknown message type");
        }
    }

    /**
     * @param {ChatSource} source 
     * @param {string} message 
     */
    onChatMessage(source, message) {
        const writer = new Writer();
        writer.writeUInt8(99);
        writer.writeUInt8(source.isServer * 128);
        writer.writeUInt8(source.color.r);
        writer.writeUInt8(source.color.g);
        writer.writeUInt8(source.color.b);
        writeZTString(writer, source.name, protocol);
        writeZTString(writer, message, protocol);
        this.send(writer.finalize());
    }

    onStatsRequest() {
        if (this.connection.player == null) return;
        const writer = new Writer();
        writer.writeUInt8(254);
        const stats = this.connection.player.world.stats;
        const legacy = {
            mode: stats.gamemode,
            update: stats.loadTime,
            playersTotal: stats.external,
            playersAlive: stats.playing,
            playersSpect: stats.spectating,
            playersLimit: stats.limit
        };
        writeZTString(writer, JSON.stringify(Object.assign({ }, legacy, stats)), protocol);
        this.send(writer.finalize());
    }

    /**
     * @param {PlayerCell} cell
     */
    onNewOwnedCell(cell) {
        const writer = new Writer();
        writer.writeUInt8(32);
        writer.writeUInt32(cell.id);
        this.send(writer.finalize());
    }

    /**
     * @param {Range} range
     * @param {boolean} includeServerInfo
     */
    onNewWorldBounds(range, includeServerInfo) {
        const writer = new Writer();
        writer.writeUInt8(64);
        writer.writeFloat64(range.x - range.w);
        writer.writeFloat64(range.y - range.h);
        writer.writeFloat64(range.x + range.w);
        writer.writeFloat64(range.y + range.h);
        if (includeServerInfo) {
            writer.writeUInt32(this.handle.gamemode.gamemodeType);
            writeZTString(writer, `OgarII ${this.handle.version}`, this.protocol);
        }
        this.send(writer.finalize());
    }

    /**
     * @param {LeaderboardType} type
     * @param {LeaderboardDataType[type][]} data
     * @param {LeaderboardDataType[type]=} selfData
     */
    onLeaderboardUpdate(type, data, selfData) {
        const writer = new Writer();
        switch (type) {
            case "ffa":
                if (protocol < 11) ffaLeaderboard4(writer, data, this.protocol);
                else ffaLeaderboard11(writer, data, selfData);
                break;
            case "pie":
                writer.writeUInt8(50);
                writer.writeUInt32(data.length);
                for (let i = 0, l = data.length; i < l; i++)
                    writer.writeFloat32(data[i]);
                break;
            case "text":
                if (protocol < 14) textBoard4(writer, data, this.protocol);
                else textBoard14(writer, data, this.protocol);
                break;
        }
        this.send(writer.finalize());
    }

    /**
     * @param {ViewArea} viewArea
     */
    onSpectatePosition(viewArea) {
        const writer = new Writer();
        writer.writeUInt8(17);
        writer.writeFloat32(viewArea.x);
        writer.writeFloat32(viewArea.y);
        writer.writeFloat32(viewArea.s);
        this.send(writer.finalize());
    }

    /**
     * @abstract
     * @param {Cell[]} add
     * @param {Cell[]} upd
     * @param {Cell[]} eat
     * @param {Cell[]} del
     */
    onVisibleCellUpdate(add, upd, eat, del) {
        const writer = new Writer();
        writer.writeUInt8(16);
        let i, l, cell;

        l = eat.length;
        writer.writeUInt16(l);
        for (i = 0; i < l; i++) {
            cell = eat[i];
            writer.writeUInt32(cell.eatenBy.id);
            writer.writeUInt32(cell.id);
        }

        for (i = 0, l = add.length; i < l; i++) {
            cell = add[i];
            if (this.protocol < 6)
                 writeCellData4 (writer, this.protocol, cell, true, true, true, true, true, true);
            else if (this.protocol < 11)
                 writeCellData6 (writer, this.protocol, cell, true, true, true, true, true, true);
            else writeCellData11(writer, this.protocol, cell, true, true, true, true, true, true);
        }
        for (i = 0, l = upd.length; i < l; i++) {
            cell = upd[i];
            if (this.protocol < 6)
                 writeCellData4 (writer, this.protocol, cell, false, cell.sizeChanged, cell.posChanged, cell.colorChanged, cell.nameChanged, cell.skinChanged);
            else if (this.protocol < 11)
                 writeCellData6 (writer, this.protocol, cell, false, cell.sizeChanged, cell.posChanged, cell.colorChanged, cell.nameChanged, cell.skinChanged);
            else writeCellData11(writer, this.protocol, cell, false, cell.sizeChanged, cell.posChanged, cell.colorChanged, cell.nameChanged, cell.skinChanged);
        }
        writer.writeUInt32(0);

        l = del.length;
        writer[this.protocol < 6 ? "writeUInt32" : "writeUInt16"](l);
        for (i = 0; i < l; i++) writer.writeUInt32(del[i].id);
    }
}

module.exports = LegacyProtocol;

/**
 * @param {Writer} writer
 * @param {LeaderboardDataType["ffa"][]} data
 * @param {number} protocol
 */
function ffaLeaderboard4(writer, data, protocol) {
    writer.writeUInt8(49);
    writer.writeUInt32(data.length);
    for (let i = 0, l = data.length; i < l; i++) {
        if (protocol === 6)
            writer.writeUInt32(data[i].highlighted ? 1 : 0);
        else if (protocol < 6)
            writer.writeUInt32(data[i].cellId);
        writeZTString(writer, data[i].name, protocol);
    }
}
/**
 * @param {Writer} writer
 * @param {LeaderboardDataType["ffa"][]} data
 * @param {LeaderboardDataType["ffa"]=} selfData
 */
function ffaLeaderboard11(writer, data, selfData) {
    let hitSelfData = false;
    writer.writeUInt8(protocol > 13 ? 51 : 53);
    for (let i = 0, l = data.length; i < l; i++) {
        if (data[i] === selfData) {
            hitSelfData = true;
            writer.writeUInt8(9);
            writer.writeUInt16(data[i].position);
        } else {
            writer.writeUInt8(2);
            writer.writeZTStringUTF8(data[i].name);
        }
    }
    if (selfData !== null && !hitSelfData) {
        writer.writeUInt8(9);
        writer.writeUInt16(selfData.position);
    }
}

/**
 * @param {Writer} writer
 * @param {LeaderboardDataType["text"][]} data
 * @param {number} protocol
 */
function textBoard4(writer, data, protocol) {
    writer.writeUInt8(48);
    writer.writeUInt32(data.length);
    for (let i = 0, l = data.length; i < l; i++)
        writer.writeZTString(data[i], protocol);
}
/**
 * @param {Writer} writer
 * @param {LeaderboardDataType["text"][]} data
 * @param {number} protocol
 */
function textBoard14(writer, data, protocol) {
    writer.writeUInt8(53);
    for (let i = 0, l = data.length; i < l; i++) {
        writer.writeUInt8(2);
        writer.writeZTStringUTF8(data[i]);
    }
}

/**
 * @param {Writer} writer
 * @param {Cell} cell
 * @param {boolean} includeType
 * @param {boolean} includeSize
 * @param {boolean} includePos
 * @param {boolean} includeColor
 * @param {boolean} includeName
 * @param {boolean} includeSkin
 */
function writeCellData4(writer, protocol, cell, includeType, includeSize, includePos, includeColor, includeName, includeSkin) {
    writer.writeUInt32(cell.id);
    writer[protocol === 4 ? "writeUInt16" : "writeUInt32"](cell.x);
    writer[protocol === 4 ? "writeUInt16" : "writeUInt32"](cell.y);
    writer.writeUInt16(cell.size);
    writer.writeUInt8(cell.color.r);
    writer.writeUInt8(cell.color.g);
    writer.writeUInt8(cell.color.b);

    let flags = 0;
    if (cell.isSpiked) flags |= 0x01;
    if (includeSkin) flags |= 0x04;
    if (cell.isAgitated) flags |= 0x10;
    if (cell.type === 3) flags |= 0x20;
    writer.writeUInt8(flags);

    if (includeSkin) writer.writeZTStringUTF8(cell.skin);
    if (includeName) writer.writeZTStringUCS2(cell.name);
    else writer.writeUInt16(0);
}

/**
 * @param {Writer} writer
 * @param {Cell} cell
 * @param {boolean} includeType
 * @param {boolean} includeSize
 * @param {boolean} includePos
 * @param {boolean} includeColor
 * @param {boolean} includeName
 * @param {boolean} includeSkin
 */
function writeCellData6(writer, protocol, cell, includeType, includeSize, includePos, includeColor, includeName, includeSkin) {
    writer.writeUInt32(cell.id);
    writer.writeUInt32(cell.x);
    writer.writeUInt32(cell.y);
    writer.writeUInt16(cell.size);

    let flags = 0;
    if (cell.isSpiked) flags |= 0x01;
    if (includeColor) flags |= 0x02;
    if (includeSkin) flags |= 0x04;
    if (includeName) flags |= 0x08;
    if (cell.isAgitated) flags |= 0x10;
    if (cell.type === 3) flags |= 0x20;
    writer.writeUInt8(flags);

    if (includeColor) {
        writer.writeUInt8(cell.color.r);
        writer.writeUInt8(cell.color.g);
        writer.writeUInt8(cell.color.b);
    }
    if (includeSkin) writer.writeZTStringUTF8(cell.skin);
    if (includeName) writer.writeZTStringUTF8(cell.name);
}

/**
 * @param {Writer} writer
 * @param {Cell} cell
 * @param {boolean} includeType
 * @param {boolean} includeSize
 * @param {boolean} includePos
 * @param {boolean} includeColor
 * @param {boolean} includeName
 * @param {boolean} includeSkin
 */
function writeCellData11(writer, protocol, cell, includeType, includeSize, includePos, includeColor, includeName, includeSkin) {
    writer.writeUInt32(cell.id);
    writer.writeUInt32(cell.x);
    writer.writeUInt32(cell.y);
    writer.writeUInt16(cell.size);

    let flags = 0;
    if (cell.isSpiked) flags |= 0x01;
    if (includeColor) flags |= 0x02;
    if (includeSkin) flags |= 0x04;
    if (includeName) flags |= 0x08;
    if (cell.isAgitated) flags |= 0x10;
    if (cell.type === 3) flags |= 0x20;
    if (includeType && cell.type === 1) flags |= 0x80;
    writer.writeUInt8(flags);

    if (includeType && cell.type === 1) writer.writeUInt8(cell.type);
    if (includeColor) {
        writer.writeUInt8(cell.color.r);
        writer.writeUInt8(cell.color.g);
        writer.writeUInt8(cell.color.b);
    }
    if (includeSkin) writer.writeZTStringUTF8(cell.skin);
    if (includeName) writer.writeZTStringUTF8(cell.name);
}

/**
 * @param {Reader} reader
 * @param {number} protocol
 * @returns {string}
 */
function readZTString(reader, protocol) {
    return reader[protocol < 6 ? "readZTStringUCS2" : "readZTStringUTF8"]();
}
/**
 * @param {Writer} writer
 * @param {string} value
 * @param {number} protocol
 */
function writeZTString(writer, value, protocol) {
    writer[protocol < 6 ? "writeZTStringUCS2" : "writeZTStringUTF8"](value);
}

const Cell = require("../cells/Cell");
const PlayerCell = require("../cells/PlayerCell");
const Connection = require("../sockets/Connection");
const Reader = require("../primitives/Reader");
const Writer = require("../primitives/Writer");