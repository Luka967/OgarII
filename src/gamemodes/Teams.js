const Gamemode = require("./Gamemode");
const Misc = require("../primitives/Misc");

const highlightBase = 231,
       lowlightBase = 23,
      highlightDiff = 24,
       lowlightDiff = 24;
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
    const r = teamColors[index].r === highlightBase ? highlight : lowlight;
    const g = teamColors[index].g === highlightBase ? highlight : lowlight;
    const b = teamColors[index].b === highlightBase ? highlight : lowlight;
    return (r << 16) | (g << 8) | b;
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
        player.chatColor = getTeamColor(player.team);
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
     * @param {string} skin
     */
    onPlayerSpawnRequest(player, name, skin) {
        if (player.state === 0 || !player.hasWorld) return;
        const size = player.router.type === "minion" ?
            this.handle.settings.minionSpawnSize :
            this.handle.settings.playerSpawnSize;
        const pos = player.world.getSafeSpawnPos(size);
        const color = player.router.separateInTeams ? getTeamColor(player.team) : Misc.randomColor();
        player.cellName = player.chatName = player.leaderboardName = name;
        player.cellSkin = null;
        player.chatColor = player.cellColor = color;
        player.world.spawnPlayer(player, pos, size);
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
