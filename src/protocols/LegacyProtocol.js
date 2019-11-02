const Protocol = require("./Protocol");
const Reader = require("../primitives/Reader");
const Writer = require("../primitives/Writer");

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

        this.lastLeaderboardType = null;
    }

    static get type() { return "legacy"; }
    get subtype() { return `l${!isNaN(this.protocol) ? ("00" + this.protocol).slice(-2) : "//"}`; }

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
        if (!this.gotKey) {
            if (messageId !== 255) return;
            if (reader.length < 5) return void this.fail("Unexpected message format");
            this.gotKey = true;
            this.key = reader.readUInt32();
            this.connection.createPlayer();
            return;
        }
        switch (messageId) {
            case 0:
                this.connection.spawningName = readZTString(reader, this.protocol);
                break;
            case 1:
                this.connection.requestingSpectate = true;
                break;
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
            case 18: this.connection.isPressingQ = true; break;
            case 19: this.connection.isPressingQ = this.hasProcessedQ = false; break;
            case 21:
                if (this.connection.controllingMinions)
                    for (let i = 0, l = this.connection.minions.length; i < l; i++)
                        this.connection.minions[i].ejectAttempts++;
                else this.connection.ejectAttempts++;
                break;
            case 22:
                if (!this.gotKey || !this.settings.minionEnableERTPControls) break;
                for (let i = 0, l = this.connection.minions.length; i < l; i++)
                    this.connection.minions[i].splitAttempts++;
                break;
            case 23:
                if (!this.gotKey || !this.settings.minionEnableERTPControls) break;
                for (let i = 0, l = this.connection.minions.length; i < l; i++)
                    this.connection.minions[i].ejectAttempts++;
                break;
            case 24:
                if (!this.gotKey || !this.settings.minionEnableERTPControls) break;
                this.connection.minionsFrozen = !this.connection.minionsFrozen;
                break;
            case 99:
                if (reader.length < 2)
                    return void this.fail(1003, "Bad message format");
                const flags = reader.readUInt8();
                const skipLen = 2 * ((flags & 2) + (flags & 4) + (flags & 8))
                if (reader.length < 2 + skipLen)
                    return void this.fail(1003, "Unexpected message format");
                reader.skip(skipLen);
                const message = readZTString(reader, this.protocol);
                this.connection.onChatMessage(message);
                break;
            case 254:
                if (this.connection.hasPlayer && this.connection.player.hasWorld)
                    this.onStatsRequest();
                break;
            case 255: return void this.fail(1003, "Unexpected message");
            default: return void this.fail(1003, "Unknown message type");
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
        writer.writeColor(source.color);
        writeZTString(writer, source.name, this.protocol);
        writeZTString(writer, message, this.protocol);
        this.send(writer.finalize());
    }

    onStatsRequest() {
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
        writeZTString(writer, JSON.stringify(Object.assign({}, legacy, stats)), this.protocol);
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
     * @param {Rect} range
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
            writer.writeUInt32(this.handle.gamemode.type);
            writeZTString(writer, `OgarII ${this.handle.version}`, this.protocol);
        }
        this.send(writer.finalize());
    }

    onWorldReset() {
        const writer = new Writer();
        writer.writeUInt8(18);
        this.send(writer.finalize());
        if (this.lastLeaderboardType !== null) {
            this.onLeaderboardUpdate(this.lastLeaderboardType, [], null);
            this.lastLeaderboardType = null;
        }
    }

    /**
     * @param {LeaderboardType} type
     * @param {LeaderboardDataType[type][]} data
     * @param {LeaderboardDataType[type]=} selfData
     */
    onLeaderboardUpdate(type, data, selfData) {
        this.lastLeaderboardType = type;
        const writer = new Writer();
        switch (type) {
            case "ffa": ffaLeaderboard[this.protocol](writer, data, selfData, this.protocol); break;
            case "pie": pieLeaderboard[this.protocol](writer, data, selfData, this.protocol); break;
            case "text": textBoard[this.protocol](writer, data, this.protocol); break;
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
        const source = this.connection.player;
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
            writeCellData[this.protocol](writer, source, this.protocol, cell,
                true, true, true, true, true, true);
        }
        for (i = 0, l = upd.length; i < l; i++) {
            cell = upd[i];
            writeCellData[this.protocol](writer, source, this.protocol, cell,
                false, cell.sizeChanged, cell.posChanged, cell.colorChanged, cell.nameChanged, cell.skinChanged);
        }
        writer.writeUInt32(0);

        l = del.length;
        writer[this.protocol < 6 ? "writeUInt32" : "writeUInt16"](l);
        for (i = 0; i < l; i++) writer.writeUInt32(del[i].id);
        this.send(writer.finalize());
    }
}

module.exports = LegacyProtocol;

/**
 * @type {{ [protocol: number]: (writer: Writer, data: LeaderboardDataType["pie"][], selfData: LeaderboardDataType["pie"], protocol: number) => void }}
 */
const pieLeaderboard = {
    4: pieLeaderboard4,
    5: pieLeaderboard4,
    6: pieLeaderboard4,
    7: pieLeaderboard4,
    8: pieLeaderboard4,
    9: pieLeaderboard4,
    10: pieLeaderboard4,
    11: pieLeaderboard4,
    12: pieLeaderboard4,
    13: pieLeaderboard4,
    14: pieLeaderboard4,
    15: pieLeaderboard4,
    16: pieLeaderboard4,
    17: pieLeaderboard4,
    18: pieLeaderboard4,
    19: pieLeaderboard4,
    20: pieLeaderboard4,
    21: pieLeaderboard21,
    22: pieLeaderboard21
};
/**
 * @param {Writer} writer
 * @param {LeaderboardDataType["pie"][]} data
 * @param {LeaderboardDataType["pie"]=} selfData
 * @param {number} protocol
 */
function pieLeaderboard4(writer, data, protocol) {
    writer.writeUInt8(50);
    writer.writeUInt32(data.length);
    for (let i = 0, l = data.length; i < l; i++)
        writer.writeFloat32(data[i].weight);
}
/**
 * @param {Writer} writer
 * @param {LeaderboardDataType["pie"][]} data
 * @param {LeaderboardDataType["pie"]=} selfData
 * @param {number} protocol
 */
function pieLeaderboard21(writer, data, protocol) {
    writer.writeUInt8(50);
    writer.writeUInt32(data.length);
    for (let i = 0, l = data.length; i < l; i++) {
        writer.writeFloat32(data[i].weight);
        writer.writeColor(data[i].color);
    }
}

/**
 * @type {{ [protocol: number]: (writer: Writer, data: LeaderboardDataType["ffa"][], selfData: LeaderboardDataType["ffa"], protocol: number) => void }}
 */
const ffaLeaderboard = {
    4: ffaLeaderboard4,
    5: ffaLeaderboard4,
    6: ffaLeaderboard4,
    7: ffaLeaderboard4,
    8: ffaLeaderboard4,
    9: ffaLeaderboard4,
    10: ffaLeaderboard4,
    11: ffaLeaderboard11,
    12: ffaLeaderboard11,
    13: ffaLeaderboard11,
    14: ffaLeaderboard11,
    15: ffaLeaderboard11,
    16: ffaLeaderboard11,
    17: ffaLeaderboard11,
    18: ffaLeaderboard11,
    19: ffaLeaderboard11,
    20: ffaLeaderboard11,
    21: ffaLeaderboard11,
    22: ffaLeaderboard11
};
/**
 * @param {Writer} writer
 * @param {LeaderboardDataType["ffa"][]} data
 * @param {LeaderboardDataType["ffa"]=} selfData
 * @param {number} protocol
 */
function ffaLeaderboard4(writer, data, selfData, protocol) {
    writer.writeUInt8(49);
    writer.writeUInt32(data.length);
    for (let i = 0, l = data.length; i < l; i++) {
        const item = data[i];
        if (protocol === 6)
            writer.writeUInt32(item.highlighted ? 1 : 0);
        else writer.writeUInt32(item.cellId);
        writeZTString(writer, item.name, protocol);
    }
}
/**
 * @param {Writer} writer
 * @param {LeaderboardDataType["ffa"][]} data
 * @param {LeaderboardDataType["ffa"]=} selfData
 * @param {number} protocol
 */
function ffaLeaderboard11(writer, data, selfData, protocol) {
    writer.writeUInt8(protocol >= 14 ? 53 : 51);
    for (let i = 0, l = data.length; i < l; i++) {
        const item = data[i];
        if (item === selfData)
            writer.writeUInt8(8);
        else {
            writer.writeUInt8(2);
            writer.writeZTStringUTF8(item.name);
        }
    }
}

/**
 * @type {{ [protocol: number]: (writer: Writer, data: LeaderboardDataType["text"][], protocol: number) => void }}
 */
const textBoard = {
    4: textBoard4,
    5: textBoard4,
    6: textBoard4,
    7: textBoard4,
    8: textBoard4,
    9: textBoard4,
    10: textBoard4,
    11: textBoard4,
    12: textBoard4,
    13: textBoard4,
    14: textBoard14,
    15: textBoard14,
    16: textBoard14,
    17: textBoard14,
    18: textBoard14,
    19: textBoard14,
    20: textBoard14,
    21: textBoard14,
    22: textBoard14
};
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
 * @type {{ [protocol: number]: (writer: Writer, source: Player, protocol: number, cell: Cell, includeType: boolean, includeSize: boolean, includePos: boolean, includeColor: boolean, includeName: boolean, includeSkin: boolean) => void }}
 */
const writeCellData = {
    4: writeCellData4,
    5: writeCellData4,
    6: writeCellData6,
    7: writeCellData6,
    8: writeCellData6,
    9: writeCellData6,
    10: writeCellData6,
    11: writeCellData11,
    12: writeCellData11,
    13: writeCellData11,
    14: writeCellData11,
    15: writeCellData11,
    16: writeCellData11,
    17: writeCellData11,
    18: writeCellData11,
    19: writeCellData11,
    20: writeCellData11,
    21: writeCellData11,
    22: writeCellData11
};
/**
 * @param {Writer} writer
 * @param {Player} source
 * @param {number} protocol
 * @param {Cell} cell
 * @param {boolean} includeType
 * @param {boolean} includeSize
 * @param {boolean} includePos
 * @param {boolean} includeColor
 * @param {boolean} includeName
 * @param {boolean} includeSkin
 */
function writeCellData4(writer, source, protocol, cell, includeType, includeSize, includePos, includeColor, includeName, includeSkin) {
    writer.writeUInt32(cell.id);
    writer[protocol === 4 ? "writeInt16" : "writeInt32"](cell.x);
    writer[protocol === 4 ? "writeInt16" : "writeInt32"](cell.y);
    writer.writeUInt16(cell.size);
    writer.writeColor(cell.color);

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
 * @param {Player} source
 * @param {number} protocol
 * @param {Cell} cell
 * @param {boolean} includeType
 * @param {boolean} includeSize
 * @param {boolean} includePos
 * @param {boolean} includeColor
 * @param {boolean} includeName
 * @param {boolean} includeSkin
 */
function writeCellData6(writer, source, protocol, cell, includeType, includeSize, includePos, includeColor, includeName, includeSkin) {
    writer.writeUInt32(cell.id);
    writer.writeInt32(cell.x);
    writer.writeInt32(cell.y);
    writer.writeUInt16(cell.size);

    let flags = 0;
    if (cell.isSpiked) flags |= 0x01;
    if (includeColor) flags |= 0x02;
    if (includeSkin) flags |= 0x04;
    if (includeName) flags |= 0x08;
    if (cell.isAgitated) flags |= 0x10;
    if (cell.type === 3) flags |= 0x20;
    writer.writeUInt8(flags);

    if (includeColor) writer.writeColor(cell.color);
    if (includeSkin) writer.writeZTStringUTF8(cell.skin);
    if (includeName) writer.writeZTStringUTF8(cell.name);
}
/**
 * @param {Writer} writer
 * @param {Player} source
 * @param {number} protocol
 * @param {Cell} cell
 * @param {boolean} includeType
 * @param {boolean} includeSize
 * @param {boolean} includePos
 * @param {boolean} includeColor
 * @param {boolean} includeName
 * @param {boolean} includeSkin
 */
function writeCellData11(writer, source, protocol, cell, includeType, includeSize, includePos, includeColor, includeName, includeSkin) {
    writer.writeUInt32(cell.id);
    writer.writeInt32(cell.x);
    writer.writeInt32(cell.y);
    writer.writeUInt16(cell.size);

    let flags = 0;
    if (cell.isSpiked) flags |= 0x01;
    if (includeColor) flags |= 0x02;
    if (includeSkin) flags |= 0x04;
    if (includeName) flags |= 0x08;
    if (cell.isAgitated) flags |= 0x10;
    if (cell.type === 3) flags |= 0x20;
    if (cell.type === 3 && cell.owner !== source) flags |= 0x40;
    if (includeType && cell.type === 1) flags |= 0x80;
    writer.writeUInt8(flags);
    if (includeType && cell.type === 1) writer.writeUInt8(1);

    if (includeColor) writer.writeColor(cell.color);
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
const Player = require("../worlds/Player");
const PlayerCell = require("../cells/PlayerCell");
const Connection = require("../sockets/Connection");
