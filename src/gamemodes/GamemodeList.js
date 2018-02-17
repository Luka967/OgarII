const FFA = require("./FFA");

class GamemodeList {
    /**
     * @param {ServerHandle} handle
     */
    constructor(handle) {
        this.handle = handle;
        /** @type {{[gamemodeName: string]: typeof Gamemode}} */
        this.list = { };
        this.register(FFA);
    }

    /**
     * @param {typeof Gamemode} gamemodeType
     */
    register(gamemodeType) {
        if (this.list.hasOwnProperty(gamemodeType.gamemodeName))
            throw new Error("gamemode conflicts with another already registered one");
        this.list[gamemodeType.gamemodeName] = gamemodeType;
    }

    /**
     * @param {String} name
     */
    setGamemode(name) {
        if (!this.list.hasOwnProperty(name))
            throw new Error("unknown gamemode");
        this.handle.gamemode = new (this.list[name])(this.handle);
    }
}

module.exports = GamemodeList;

const Gamemode = require("./Gamemode");
const ServerHandle = require("../ServerHandle");