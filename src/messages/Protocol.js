/**
 * @abstract
 */
class Protocol {
    /**
     * @param {Connection} connection
     */
    constructor(connection) {
        this.connection = connection;
    }

    get logger() { return this.connection.listener.handle.logger; }
    get settings() { return this.connection.listener.handle.settings; }

    /**
     * @abstract
     * @param {Reader} reader
     * @returns {boolean}
     */
    distinguish(reader) { throw new Error("Must be implemented"); }

    /**
     * @abstract
     * @param {Reader} reader
     */
    onSocketMessage(reader) { throw new Error("Must be implemented"); }

    /**
     * @abstract
     * @param {ChatSource} source
     * @param {string} message
     */
    onChatMessage(source, message) { throw new Error("Must be implemented"); }
    /**
     * @abstract
     * @param {PlayerCell} cell
     */
    onNewCell(cell) { throw new Error("Must be implemented"); }
    /**
     * @param {World} world
     * @param {boolean} includeServerInfo
     */
    onNewWorldBounds(world, includeServerInfo) { throw new Error("Must be implemented"); }
    /**
     * @abstract
     * @param {LeaderboardType} type
     * @param {LeaderboardDataType[type][]} data
     */
    onLeaderboardUpdate(type, data) { throw new Error("Must be implemented"); }
    /**
     * @abstract
     * @param {ViewArea} viewArea
     */
    onSpectatePosition(viewArea) { throw new Error("Must be implemented"); }
    /**
     * @abstract
     * @param {Connection} requesting
     * @param {Cell[]} add
     * @param {Cell[]} upd
     * @param {Cell[]} eat
     * @param {Cell[]} del
     */
    onVisibleCellUpdate(requesting, add, upd, eat, del) { throw new Error("Must be implemented"); }

    /** @param {Buffer} data */
    send(data) {
        this.connection.send(data);
    }

    /**
     * @param {number=} code
     * @param {string=} reason
     */
    fail(code, reason) {
        this.connection.closeSocket(code || 1003, reason || "Unspecified protocol fail");
    }
}

module.exports = Protocol;

const Reader = require("../primitives/Reader");
const Cell = require("../cells/Cell");
const PlayerCell = require("../cells/PlayerCell");
const Connection = require("../sockets/Connection");