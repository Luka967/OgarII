const Settings = require("./Settings");

const { CommandList } = require("./commands/Commands");
const DefaultCommands = require("./commands/DefaultCommands");

const Stopwatch = require("./primitives/Stopwatch");
const Logger = require("./primitives/Logger");
const Ticker = require("./primitives/Ticker");
const { version } = require("./primitives/Misc");

const Listener = require("./sockets/Listener");
const Matchmaker = require("./worlds/Matchmaker");
const Player = require("./worlds/Player");
const World = require("./worlds/World");

// DEBUG
const GamemodeList = require("./gamemodes/GamemodeList");

class ServerHandle {
    /**
     * @param {Settings} settings
     */
    constructor(settings) {
        /** @type {Settings} */
        this.settings = Settings;
        this.setSettings(settings);

        this.gamemodes = new GamemodeList(this);
        /** @type {Gamemode} */
        this.gamemode = null;
        this.commands = new CommandList(this);
        DefaultCommands(this.commands);

        this.running = false;
        /** @type {Date} */
        this.startTime = null;
        this.averageTickTime = NaN;
        this.tick = NaN;
        
        this.ticker = new Ticker(40);
        this.ticker.add(this._onTick.bind(this));
        this.stopwatch = new Stopwatch();
        this.logger = new Logger();
        
        this.listener = new Listener(this);
        this.matchmaker = new Matchmaker(this);
        /** @type {{[id: string]: World}} */
        this.worlds = { };
        /** @type {{[id: string]: Player}} */
        this.players = { };
    }

    /**
     * @param {Settings} settings
     */
    setSettings(settings) {
        this.settings = Object.assign({ }, Settings, settings);
    }

    start() {
        if (this.running) return false;
        this.logger.inform("starting");
        
        this.gamemodes.setGamemode(this.settings.gamemode);
        this.startTime = new Date();
        this.averageTickTime = this.tick = 0;
        this.running = true;

        this.listener.open();
        this.ticker.start();
        this.gamemode.onHandleStart();

        this.logger.inform("ticker begin");
        this.logger.inform(`\u001B[1m\u001B[32mOgarII\u001B[0m\u001B[32m ${version}\u001B[0m`);
        return true;
    }

    stop() {
        if (!this.running) return false;
        this.logger.inform("stopping");

        this.ticker.stop();
        for (let id in this.worlds)
            this.removeWorld(id);
        this.gamemode.onHandleStop();
        this.listener.close();

        this.startTime = null;
        this.averageTickTime = this.tick = NaN;
        this.running = false;

        this.logger.inform("ticker stop");
        return true;
    }

    /** @returns {World} */
    createWorld() {
        let id = 0;
        while (this.worlds.hasOwnProperty(++id)) ;
        const newWorld = new World(this, id);
        this.worlds[id] = newWorld;
        this.gamemode.onNewWorld(newWorld);
        this.logger.debug(`added a world with id ${id}`);
        return newWorld;
    }

    /**
     * @param {Number} id
     * @returns {Boolean}
     */
    removeWorld(id) {
        if (!this.worlds.hasOwnProperty(id)) return false;
        this.gamemode.onWorldDestroy(this.worlds[id]);
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
        this.gamemode.onNewPlayer(newPlayer);
        return newPlayer;
    }

    /**
     * @param {Number} id
     * @returns {Boolean}
     */
    removePlayer(id) {
        if (!this.players.hasOwnProperty(id)) return false;
        this.gamemode.onPlayerDestroy(this.players[id]);
        this.players[id].destroy();
        this.players[id].exists = false;
        delete this.players[id];
        return true;
    }

    _onTick() {
        this.stopwatch.begin();
        this.tick++;

        for (let id in this.worlds)
            this.worlds[id].update();
        this.listener.update();
        this.gamemode.onHandleTick();
        this.matchmaker.update();

        this.averageTickTime = this.stopwatch.elapsed();
        this.stopwatch.stop();
    }
}

module.exports = ServerHandle;

const PlayingRouter = require("./primitives/PlayingRouter");
const Gamemode = require("./gamemodes/Gamemode");