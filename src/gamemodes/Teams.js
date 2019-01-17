const Gamemode = require("./Gamemode");
const Misc = require("../primitives/Misc");

const highlightBase = 204,
       lowlightBase = 51,
      highlightDiff = 52,
       lowlightDiff = 52;
const teamColors = [
    { r: highlightBase, g: lowlightBase, b: lowlightBase },
    { r: lowlightBase, g: highlightBase, b: lowlightBase },
    { r: lowlightBase, g: lowlightBase, b: highlightBase }
];
const teamCount = teamColors.length;

/**
 * @param {number} index
 */
function getTeamColor(index) {
    const random = Math.random();
    const highlight = highlightBase + ~~(random * highlightDiff);
    const lowlight  =  lowlightBase - ~~(random * lowlightDiff);
    return {
        r: teamColors[index].r === highlightBase ? highlight : lowlight,
        g: teamColors[index].g === highlightBase ? highlight : lowlight,
        b: teamColors[index].b === highlightBase ? highlight : lowlight
    };
}

class Teams extends Gamemode {
    /** @param {ServerHandle} handle */
    constructor(handle) {
        super(handle);
    }

    static get name() { return "Teams"; }
    static get type() { return 1; }

    /**
     * @param {World} world
     */
    onNewWorld(world) {
        world.teams = { };
        for (let i = 0; i < teamCount; i++)
            world.teams[i] = [];
    }
    /**
     * @param {Player} player
     * @param {World} world
     */
    onPlayerJoinWorld(player, world) {
        if (!player.router.separateInTeams) return;
        let s = 0;
        for (let i = 0; i < teamCount; i++)
            s = world.teams[i].length < world.teams[s].length ? i : s;
        world.teams[s].push(player);
        player.team = s;
    }
    /**
     * @param {Player} player
     * @param {World} world
     */
    onPlayerLeaveWorld(player, world) {
        if (!player.router.separateInTeams) return;
        world.teams[player.team].splice(world.teams[player.team].indexOf(player), 1);
        player.team = null;
    }

    /**
     * @param {Player} player
     * @param {string} name
     */
    onPlayerSpawnRequest(player, name) {
        if (player.state === 0) return;
        const size = player.router.type === "minion" ?
            this.handle.settings.minionSpawnSize :
            this.handle.settings.playerSpawnSize;
        const pos = player.world.getSafeSpawnPos(size);
        if (player.router.separateInTeams)
            player.world.spawnPlayer(player, getTeamColor(player.team), pos, size, name, null);
        else player.world.spawnPlayer(player, Misc.randomColor(), pos, size, name, null);
    }

    /**
     * @param {World} world
     */
    compileLeaderboard(world) {
        const teams = world.leaderboard = new Array(teamCount).fill(0);
        let sum = 0;
        for (let i = 0; i < world.playerCells.length; i++) {
            const cell = world.playerCells[i];
            if (cell.owner.team === null) continue;
            teams[cell.owner.team] += cell.squareSize;
            sum += cell.squareSize;
        }
        for (let i = 0; i < teamCount; i++) teams[i] /= sum;
    }

    /** @param {Connection} connection */
    sendLeaderboard(connection) {
        connection.protocol.onLeaderboardUpdate("pie", connection.player.world.leaderboard);
    }
}

module.exports = Teams;

const ServerHandle = require("../ServerHandle");
const World = require("../worlds/World");
const Connection = require("../sockets/Connection");
const Player = require("../worlds/Player");
