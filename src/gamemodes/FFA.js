const Gamemode = require("./Gamemode");
const Misc = require("../primitives/Misc");

/**
 * @param {Player} player
 * @param {Player} requesting
 * @param {number} index
 */
function getLeaderboardData(player, requesting, index) {
    return {
        name: player.leaderboardName,
        highlighted: requesting.id === player.id,
        cellId: player.ownedCells[0].id,
        position: 1 + index
    };
}

class FFA extends Gamemode {
    /**
     * @param {ServerHandle} handle
     */
    constructor(handle) {
        super(handle);
    }

    static get type() { return 0; }
    static get name() { return "FFA"; }

    /**
     * @param {Player} player
     * @param {string} name
     * @param {string} skin
     */
    onPlayerSpawnRequest(player, name, skin) {
        if (player.state === 0 || !player.hasWorld) return;
        const size = player.router.type === "minion" ?
             this.handle.settings.minionSpawnSize :
             this.handle.settings.playerSpawnSize;
        const spawnInfo = player.world.getPlayerSpawn(size);
        const color = spawnInfo.color || Misc.randomColor();
        player.cellName = player.chatName = player.leaderboardName = name;
        player.cellSkin = skin;
        player.chatColor = player.cellColor = color;
        player.world.spawnPlayer(player, spawnInfo.pos, size, name, null);
    }

    /**
     * @param {World} world
     */
    compileLeaderboard(world) {
        world.leaderboard = world.players.slice(0).filter((v) => !isNaN(v.score)).sort((a, b) => b.score - a.score);
    }

    /**
     * @param {Connection} connection
     */
    sendLeaderboard(connection) {
        if (!connection.hasPlayer) return;
        const player = connection.player;
        if (!player.hasWorld) return;
        if (player.world.frozen) return;
        /** @type {Player[]} */
        const leaderboard = player.world.leaderboard;
        const data = leaderboard.map((v, i) => getLeaderboardData(v, player, i));
        const selfData = isNaN(player.score) ? null : data[leaderboard.indexOf(player)];
        connection.protocol.onLeaderboardUpdate("ffa", data.slice(0, 10), selfData);
    }
}

module.exports = FFA;

const ServerHandle = require("../ServerHandle");
const World = require("../worlds/World");
const Connection = require("../sockets/Connection");
const Player = require("../worlds/Player");
