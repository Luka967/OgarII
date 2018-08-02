const FFA = require("./FFA");
const Teams = require("./Teams");
const LastManStanding = require("./LastManStanding");

class GamemodeList {
    /**
     * @param {ServerHandle} handle
     */
    constructor(handle) {
        this.handle = handle;
        /** @type {Indexed<typeof Gamemode>} */
        this.list = { };
        this.register(FFA, Teams, LastManStanding);
    }

    /**
     * @param {typeof Gamemode[]} gamemodeTypes
     */
    register(...gamemodeTypes) {
        for (let i = 0, l = gamemodeTypes.length; i < l; i++) {
            const next = gamemodeTypes[i];
            if (this.list.hasOwnProperty(next.gamemodeName))
                throw new Error("gamemode conflicts with another already registered one");
            this.list[next.gamemodeName] = next;
        }
    }

    /**
     * @param {string} name
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