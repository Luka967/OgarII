class Gamemode {
    /** @param {ServerHandle} handle */
    constructor(handle) {
        this.handle = handle;
    }

    /** Reserved for possible future plugin system @returns {Number} @abstract */
    get id() { throw new Error("Must be overriden"); }
    /** @returns {Number} @abstract */
    get gamemodeType() { throw new Error("Must be overriden"); }
    /** @returns {String} @abstract */
    get name() { throw new Error("Must be overriden"); }

    /** @virtual */
    onHandleStart() { }
    /** @virtual */
    onHandleTick() { }
    /** @virtual */
    onHandleStop() { }

    /** @param {World} world @virtual */
    canJoinWorld(world) { return !world.frozen; }

    /** @param {World} world @virtual */
    onNewWorld(world) { }
    /** @param {World} world @virtual */
    onWorldTick(world) { }
    /** @param {World} world @abstract */
    compileLeaderboard(world) {
        throw new Error("Must be overriden");
    }
    /** @param {Connection} connection @abstract */
    sendLeaderboard(connection) {
        throw new Error("Must be overriden");
    }
    /** @param {World} world @virtual */
    onWorldDestroy(world) { }

    /** @param {Player} player @virtual */
    onNewPlayer(player) { }
    /** @param {Player} player @virtual */
    whenPlayerPressQ(player) {
        player.updateState(2);
    }
    /** @param {Player} player @virtual */
    whenPlayerEject(player) {
        if (player.world === null) return;
        player.world.ejectFromPlayer(player);
    }
    /** @param {Player} player @virtual */
    whenPlayerSplit(player) {
        if (player.world === null) return;
        player.world.splitPlayer(player);
    }
    /** @param {Player} player @param {String} name @abstract */
    onPlayerSpawnRequest(player, name) {
        throw new Error("Must be overriden");
    }
    /** @param {Player} player @virtual */
    onPlayerDestroy(player) { }

    /** @param {Cell} cell @virtual */
    onNewCell(cell) { }
    /** @param {Cell} a @param {Cell} b @virtual */
    canEat(a, b) { return true; }
    /** @param {PlayerCell} cell @virtual */
    getDecayMult(cell) { return cell.world.settings.playerDecayMult; }
    /** @param {Cell} cell @virtual */
    onCellRemove(cell) { }
}

module.exports = Gamemode;

const ServerHandle = require("../ServerHandle");
const World = require("../worlds/World");
const Connection = require("../sockets/Connection");
const Player = require("../worlds/Player");
const Cell = require("../cells/Cell");
const PlayerCell = require("../cells/PlayerCell");