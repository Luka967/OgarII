class GamemodeList {
    /**
     * @param {ServerHandle} handle
     */
    constructor(handle) {
        this.handle = handle;
        /** @type {Indexed<typeof Gamemode>} */
        this.store = { };
    }

    /**
     * @param {typeof Gamemode[]} gamemodes
     */
    register(...gamemodes) {
        for (let i = 0, l = gamemodes.length; i < l; i++) {
            const next = gamemodes[i];
            if (this.store.hasOwnProperty(next.name))
                throw new Error(`gamemode ${next.name} conflicts with another already registered one`);
            this.store[next.name] = next;
        }
    }

    /**
     * @param {string} name
     */
    setGamemode(name) {
        if (!this.store.hasOwnProperty(name))
            throw new Error("unknown gamemode");
        this.handle.gamemode = new (this.store[name])(this.handle);
    }
}

module.exports = GamemodeList;

const Gamemode = require("./Gamemode");
const ServerHandle = require("../ServerHandle");
