const Gamemode = require("./Gamemode");
const Misc = require("../primitives/Misc");

class FFA extends Gamemode {
    /** @param {ServerHandle} handle */
    constructor(handle) {
        super(handle);
    }

    get id() { return 0; }
    get gamemodeType() { return 0; }

    /** @param {Player} player @param {String} name */
    onPlayerSpawnRequest(player, name) {
        if (player.ownedCells.length > 0) return;
        const size = player.settings.playerSpawnSize;
        const spawnInfo = player.world.getPlayerSpawnPos(size);
        player.world.spawnPlayer(player, spawnInfo.color || Misc.randomColor(), spawnInfo.pos, size, name, null);
    }
}

module.exports = FFA;

const ServerHandle = require("../ServerHandle");
const World = require("../worlds/World");
const Connection = require("../sockets/Connection");
const Player = require("../worlds/Player");