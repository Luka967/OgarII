const Gamemode = require("./Gamemode");
const Misc = require("../primitives/Misc");
const Messages = {
    UpdateLeaderboard: require("../messages/UpdateLeaderboard")
};

class FFA extends Gamemode {
    /** @param {ServerHandle} handle */
    constructor(handle) {
        super(handle);
    }

    get id() { return 0; }
    get gamemodeType() { return 0; }
    get name() { return "FFA"; }

    /** @param {Player} player @param {String} name */
    onPlayerSpawnRequest(player, name) {
        if (player.state === 0) return;
        const size = player.settings.playerSpawnSize;
        const spawnInfo = player.world.getPlayerSpawnPos(size);
        player.world.spawnPlayer(player, spawnInfo.color || Misc.randomColor(), spawnInfo.pos, size, name, null);
    }

    /** @param {World} world */
    compileLeaderboard(world) {
        world.leaderboard = world.players.slice(0).filter((v) => !isNaN(v.score)).sort((a, b) => b.score - a.score);
    }

    /** @param {Connection} connection */
    sendLeaderboard(connection) {
        const player = connection.player;
        if (player === null) return;
        if (player.world === null) return;
        /** @type {Player[]} */
        const leaderboard = player.world.leaderboard;
        const data = leaderboard.map((v, i) => getLeaderboardData(v, player, i));
        const selfData = isNaN(player.score) ? null : data[leaderboard.indexOf(player)];
        connection.send(Messages.UpdateLeaderboard(data.slice(0, 10), selfData, connection.protocol));
    }
}

module.exports = FFA;

/**
 * @param {Player} player
 * @param {Player} requesting
 * @param {Number} index
 */
function getLeaderboardData(player, requesting, index) {
    return {
        name: player.ownedCells[0].name,
        highlighted: requesting.id === player.id,
        cellId: player.ownedCells[0].id,
        position: 1 + index
    };
}

const ServerHandle = require("../ServerHandle");
const World = require("../worlds/World");
const Connection = require("../sockets/Connection");
const Player = require("../worlds/Player");