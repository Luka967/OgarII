const World = require("./worlds/World");
const Player = require("./worlds/Player");
const Listener = require("./sockets/Listener");
const Settings = require("./Settings");
const Ticker = require("./primitives/Ticker");
const Logger = require("./primitives/Logger");
// DEBUG
const FFA = require("./gamemodes/FFA");

class ServerHandle {
    /**
     * @param {Settings} settings
     */
    constructor(settings) {
        /** @type {Settings} */
        this.settings = Object.assign(Object.create(Settings), settings);
        this.listener = new Listener(this);
        this.logger = new Logger();
        this.ticker = new Ticker(40);
        this.ticker.add(this._onTick.bind(this));

        /** @type {{[id: string]: World}} */
        this.worlds = { };
        /** @type {{[id: string]: World}} */
        this.players = { };

        /** @type {Gamemode} */
        this.gamemode = new FFA(this);
        this.running = false;
        this.tick = NaN;
    }

    start() {
        if (this.running) return false;
        this.logger.inform("starting");
        this.listener.open();
        this.tick = 0;
        this.ticker.start();
        this.logger.inform("ticker begin");
        // DEBUG
        this.createWorld();
        return true;
    }

    stop() {
        if (!this.running) return false;
        this.logger.inform("stopping");
        this.listener.close();
        this.ticker.stop();
        this.tick = NaN;
        this.logger.inform("ticker stop");
        return true;
    }

    /** @returns {World} */
    createWorld() {
        let id = 0;
        while (this.worlds.hasOwnProperty(++id)) ;
        const newWorld = new World(this, id);
        this.worlds[id] = newWorld;
        this.logger.debug(`added a world with id ${id}`);
        return newWorld;
    }

    /**
     * @param {Number} id
     * @returns {Boolean}
     */
    removeWorld(id) {
        if (!this.worlds.hasOwnProperty(id)) return false;
        this.worlds[id].destroy();
        delete this.worlds[id];
        this.logger.debug(`removed world with id ${id}`);
        return true;
    }

    /**
     * @param {PlayingRouter} router
     * @returns {Player}
     */
    createPlayer(router) {
        let id = 0;
        while (this.players.hasOwnProperty(++id)) ;
        const newPlayer = new Player(this, id, router);
        this.players[id] = newPlayer;
        this.logger.debug(`added a player with id ${id}`);
        return newPlayer;
    }

    /**
     * @param {Number} id
     * @returns {Boolean}
     */
    removePlayer(id) {
        if (!this.players.hasOwnProperty(id)) return false;
        this.players[id].destroy();
        delete this.players[id];
        this.logger.debug(`removed player with id ${id}`);
        return true;
    }

    _onTick() {
        this.tick++;
        for (let id in this.worlds) this.worlds[id].update();
        this.listener.update();
    }
}

module.exports = ServerHandle;

const PlayingRouter = require("./primitives/PlayingRouter");
const Gamemode = require("./gamemodes/Gamemode");