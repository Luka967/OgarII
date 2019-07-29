const Protocol = require("./Protocol");
const Reader = require("../primitives/Reader");
const Writer = require("../primitives/Writer");

const PingReturn = Buffer.from(new Uint8Array([2]));

class ModernProtocol extends Protocol {
    /**
     * @param {Connection} connection
     */
    constructor(connection) {
        super(connection);
        this.protocol = NaN;

        this.leaderboardPending = false;
        /** @type {LeaderboardType} */
        this.leaderboardType = null;
        /** @type {LeaderboardDataType[LeaderboardType][]} */
        this.leaderboardData = null;
        /** @type {LeaderboardDataType[LeaderboardType]} */
        this.leaderboardSelfData = null;

        /** @type {{ source: ChatSource, message: string }[]} */
        this.chatPending = [];
        /** @type {Rect} */
        this.worldBorderPending = null;
        /** @type {ViewArea} */
        this.spectateAreaPending = null;
        this.serverInfoPending = false;
        this.worldStatsPending = false;
        this.clearCellsPending = false;
    }

    static get type() { return "modern"; }
    get subtype() { return `m${!isNaN(this.protocol) ? ("00" + this.protocol).slice(-2) : "//"}`; }

    /**
     * @param {Reader} reader
     */
    distinguishes(reader) {
        if (reader.length < 5) return false;
        if (reader.readUInt8() !== 1) return false;
        this.gotProtocol = true;
        this.protocol = reader.readUInt32();
        if (this.protocol !== 3) return void this.fail(1003, "Unsupported protocol version");
        this.connection.createPlayer();
        return true;
    }

    /**
     * @param {Reader} reader
     */
    onSocketMessage(reader) {
        const messageId = reader.readUInt8();
        switch (messageId) {
            case 2:
                this.send(PingReturn);
                this.worldStatsPending = true;
                break;
            case 3:
                if (reader.length < 12)
                    return void this.fail(1003, "Unexpected message format");
                let i, l, count;
                this.connection.mouseX = reader.readInt32();
                this.connection.mouseY = reader.readInt32();
                this.connection.splitAttempts += reader.readUInt8();
                count = reader.readUInt8();
                for (i = 0, l = this.connection.minions.length; count > 0 && i < l; i++)
                    this.connection.minions[i].splitAttempts += count;

                const globalFlags = reader.readUInt8();
                if (globalFlags & 1) {
                    if (reader.length < 13)
                        return void this.fail(1003, "Unexpected message format");
                    this.connection.spawningName = reader.readZTStringUTF8();
                }
                if (globalFlags & 2) this.connection.requestingSpectate = true;
                if (globalFlags & 4) this.connection.isPressingQ = true;
                if (globalFlags & 8) this.connection.isPressingQ = this.connection.hasProcessedQ = false;
                if (globalFlags & 16) this.connection.ejectAttempts++;
                if (globalFlags & 32)
                    for (i = 0, l = this.connection.minions.length; i < l; i++)
                        this.connection.minions[i].ejectAttempts++;
                if (globalFlags & 64) this.connection.minionsFrozen = !this.connection.minionsFrozen;
                if (globalFlags & 128) {
                    if (reader.length < 13 + (globalFlags & 1))
                        return void this.fail(1003, "Unexpected message format");
                    count = reader.readUInt8();
                    if (reader.length < 13 + (globalFlags & 1) + count)
                        return void this.fail(1003, "Unexpected message format");
                    for (let i = 0; i < count; i++)
                        this.connection.onChatMessage(reader.readZTStringUTF8());
                }
                break;
            default: return void this.fail(1003, "Unknown message type");
        }
    }

    /**
     * @param {ChatSource} source
     * @param {string} message
     */
    onChatMessage(source, message) {
        this.chatPending.push({
            source: source,
            message: message
        });
    }

    /**
     * @param {PlayerCell} cell
     */
    onNewOwnedCell(cell) { /* ignored */ }

    /**
     * @param {Rect} range
     * @param {boolean} includeServerInfo
     */
    onNewWorldBounds(range, includeServerInfo) {
        this.worldBorderPending = range;
        this.serverInfoPending = includeServerInfo;
    }

    onWorldReset() {
        this.clearCellsPending = true;
        this.worldBorderPending = false;
        this.worldStatsPending = false;
        this.onVisibleCellUpdate([], [], [], []);
    }

    /**
     * @param {LeaderboardType} type
     * @param {LeaderboardDataType[type][]} data
     * @param {LeaderboardDataType[type]=} selfData
     */
    onLeaderboardUpdate(type, data, selfData) {
        this.leaderboardPending = true;
        this.leaderboardType = type;
        this.leaderboardData = data;
        this.leaderboardSelfData = selfData;
    }

    /**
     * @param {ViewArea} viewArea
     */
    onSpectatePosition(viewArea) {
        this.spectateAreaPending = viewArea;
    }

    /**
     * @abstract
     * @param {Cell[]} add
     * @param {Cell[]} upd
     * @param {Cell[]} eat
     * @param {Cell[]} del
     */
    onVisibleCellUpdate(add, upd, eat, del) {
        let globalFlags = 0, hitSelfData, flags, item, i, l;

        if (this.spectateAreaPending != null) globalFlags |= 1;
        if (this.worldBorderPending != null)  globalFlags |= 2;
        if (this.serverInfoPending)           globalFlags |= 4;
        if (this.connection.hasPlayer && this.connection.player.hasWorld && this.worldStatsPending)
                                              globalFlags |= 8;
        if (this.chatPending.length > 0)      globalFlags |= 16;
        if (this.leaderboardPending)          globalFlags |= 32;
        if (this.clearCellsPending)           globalFlags |= 64,
            this.clearCellsPending = false;
        if (add.length > 0)                   globalFlags |= 128;
        if (upd.length > 0)                   globalFlags |= 256;
        if (eat.length > 0)                   globalFlags |= 512;
        if (del.length > 0)                   globalFlags |= 1024;

        if (globalFlags === 0) return;

        const writer = new Writer();
        writer.writeUInt8(3);
        writer.writeUInt16(globalFlags);

        if (this.spectateAreaPending != null) {
            writer.writeFloat32(this.spectateAreaPending.x);
            writer.writeFloat32(this.spectateAreaPending.y);
            writer.writeFloat32(this.spectateAreaPending.s);
            this.spectateAreaPending = null;
        }
        if (this.worldBorderPending != null) {
            item = this.worldBorderPending;
            writer.writeFloat32(item.x - item.w);
            writer.writeFloat32(item.x + item.w);
            writer.writeFloat32(item.y - item.h);
            writer.writeFloat32(item.y + item.h);
            this.worldBorderPending = null;
        }
        if (this.serverInfoPending) {
            writer.writeUInt8(this.handle.gamemode.type);
            item = this.handle.version.split(".");
            writer.writeUInt8(parseInt(item[0]));
            writer.writeUInt8(parseInt(item[1]));
            writer.writeUInt8(parseInt(item[2]));
            this.serverInfoPending = false;
        }
        if (this.worldStatsPending) {
            item = this.connection.player.world.stats;
            writer.writeZTStringUTF8(item.name);
            writer.writeZTStringUTF8(item.gamemode);
            writer.writeFloat32(item.loadTime / this.handle.tickDelay);
            writer.writeUInt32(item.uptime);
            writer.writeUInt16(item.limit);
            writer.writeUInt16(item.external);
            writer.writeUInt16(item.internal);
            writer.writeUInt16(item.playing);
            writer.writeUInt16(item.spectating);
            this.worldStatsPending = false;
        }
        if ((l = this.chatPending.length) > 0) {
            writer.writeUInt16(l);
            for (i = 0; i < l; i++) {
                item = this.chatPending[i];
                writer.writeZTStringUTF8(item.source.name);
                writer.writeColor(item.source.color);
                writer.writeUInt8(item.source.isServer ? 1 : 0);
                writer.writeZTStringUTF8(item.message);
            }
            this.chatPending.splice(0, l);
        }
        if (this.leaderboardPending) {
            l = this.leaderboardData.length;
            switch (this.leaderboardType) {
                case "ffa":
                    writer.writeUInt8(1);
                    for (i = 0; i < l; i++) {
                        item = this.leaderboardData[i];
                        flags = 0;
                        if (item.highlighted) flags |= 1;
                        if (item === this.leaderboardSelfData)
                            flags |= 2, hitSelfData = true;
                        writer.writeUInt16(item.position);
                        writer.writeUInt8(flags);
                        writer.writeZTStringUTF8(item.name);
                    }
                    if (!hitSelfData && (item = this.leaderboardSelfData) != null) {
                        writer.writeUInt16(item.position);
                        flags = item.highlighted ? 1 : 0;
                        writer.writeUInt8(flags);
                        writer.writeZTStringUTF8(item.name);
                    }
                    writer.writeUInt16(0);
                    break;
                case "pie":
                    writer.writeUInt8(2);
                    writer.writeUInt16(l);
                    for (i = 0; i < l; i++)
                        writer.writeFloat32(this.leaderboardData[i]);
                    break;
                case "text":
                    writer.writeUInt8(3);
                    writer.writeUInt16(l);
                    for (i = 0; i < l; i++)
                        writer.writeZTStringUTF8(this.leaderboardData[i]);
                    break;
            }

            this.leaderboardPending = false;
            this.leaderboardType = null;
            this.leaderboardData = null;
            this.leaderboardSelfData = null;
        }

        if ((l = add.length) > 0) {
            for (i = 0; i < l; i++) {
                item = add[i];
                writer.writeUInt32(item.id);
                writer.writeUInt8(item.type);
                writer.writeFloat32(item.x);
                writer.writeFloat32(item.y);
                writer.writeUInt16(item.size);
                writer.writeColor(item.color);
                flags = 0;
                if (item.type === 0 && item.owner === this.connection.player)
                    flags |= 1;
                if (!!item.name) flags |= 2;
                if (!!item.skin) flags |= 4;
                writer.writeUInt8(flags);
                if (!!item.name) writer.writeZTStringUTF8(item.name);
                if (!!item.skin) writer.writeZTStringUTF8(item.skin);
            }
            writer.writeUInt32(0);
        }
        if ((l = upd.length) > 0) {
            for (i = 0; i < l; i++) {
                item = upd[i];
                flags = 0;
                if (item.posChanged) flags |= 1;
                if (item.sizeChanged) flags |= 2;
                if (item.colorChanged) flags |= 4;
                if (item.nameChanged) flags |= 8;
                if (item.skinChanged) flags |= 16;
                writer.writeUInt32(item.id);
                writer.writeUInt8(flags);
                if (item.posChanged) {
                    writer.writeFloat32(item.x);
                    writer.writeFloat32(item.y);
                }
                if (item.sizeChanged)
                    writer.writeUInt16(item.size);
                if (item.colorChanged) writer.writeColor(item.color);
                if (item.nameChanged) writer.writeZTStringUTF8(item.name);
                if (item.skinChanged) writer.writeZTStringUTF8(item.skin);
            }
            writer.writeUInt32(0);
        }
        if ((l = eat.length) > 0) {
            for (i = 0; i < l; i++) {
                item = eat[i];
                writer.writeUInt32(item.id);
                writer.writeUInt32(item.eatenBy.id);
            }
            writer.writeUInt32(0);
        }
        if ((l = del.length) > 0) {
            for (i = 0; i < l; i++)
                writer.writeUInt32(del[i].id);
            writer.writeUInt32(0);
        }

        this.send(writer.finalize());
    }
}

module.exports = ModernProtocol;

const Cell = require("../cells/Cell");
const PlayerCell = require("../cells/PlayerCell");
const Connection = require("../sockets/Connection");
