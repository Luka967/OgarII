const Settings = require("./Settings");

const { CommandList } = require("./commands/CommandList");
const GamemodeList = require("./gamemodes/GamemodeList");
const ProtocolStore = require("./protocols/ProtocolStore");

const Stopwatch = require("./primitives/Stopwatch");
const Logger = require("./primitives/Logger");
const Ticker = require("./primitives/Ticker");
const { version } = require("./primitives/Misc");

const Listener = require("./sockets/Listener");
const Matchmaker = require("./worlds/Matchmaker");
const Player = require("./worlds/Player");
const World = require("./worlds/World");

class ServerHandle {
    /**
     * @param {Settings} settings
     */
    constructor(settings) {
        /** @type {Settings} */
        this.settings = Settings;

        this.protocols = new ProtocolStore();
        this.gamemodes = new GamemodeList(this);
        /** @type {Gamemode} */
        this.gamemode = null;
        this.commands = new CommandList(this);
        this.chatCommands = new CommandList(this);

        this.running = false;
        /** @type {Date} */
        this.startTime = null;
        this.averageTickTime = NaN;
        this.tick = NaN;
        this.tickDelay = NaN;
        this.stepMult = NaN;

        this.ticker = new Ticker(40);
        this.ticker.add(this.onTick.bind(this));
        this.stopwatch = new Stopwatch();
        this.logger = new Logger();

        this.listener = new Listener(this);
        this.matchmaker = new Matchmaker(this);
        /** @type {Identified<World>} */
        this.worlds = { };
        /** @type {Identified<Player>} */
        this.players = { };

        this.setSettings(settings);
    }

    get version() { return version; }

    /**
     * @param {Settings} settings
     */
    setSettings(settings) {
        this.settings = Object.assign({ }, Settings, settings);
        this.tickDelay = 1000 / this.settings.serverFrequency;
        this.ticker.step = this.tickDelay;
        this.stepMult = this.tickDelay / 40;
    }

    start() {
        if (this.running) return false;
        this.logger.inform("starting");

        this.gamemodes.setGamemode(this.settings.serverGamemode);
        this.startTime = new Date();
        this.averageTickTime = this.tick = 0;
        this.running = true;

        this.listener.open();
        this.ticker.start();
        this.gamemode.onHandleStart();

        this.logger.inform("ticker begin");
        this.logger.inform(`OgarII ${this.version}`);
        this.logger.inform(`gamemode: ${this.gamemode.name}`);
        return true;
    }

    stop() {
        if (!this.running) return false;
        this.logger.inform("stopping");

        if (this.ticker.running)
            this.ticker.stop();
        for (let id in this.worlds)
            this.removeWorld(id);
        for (let id in this.players)
            this.removePlayer(id);
        for (let i = 0, l = this.listener.routers; i < l; i++)
            this.listener.routers[0].close();
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
        newWorld.afterCreation();
        this.logger.debug(`added a world with id ${id}`);
        return newWorld;
    }

    /**
     * @param {number} id
     * @returns {boolean}
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
     * @param {Router} router
     * @returns {Player}
     */
    createPlayer(router) {
        let id = 0;
        while (this.players.hasOwnProperty(++id)) ;
        const newPlayer = new Player(this, id, router);
        this.players[id] = newPlayer;
        router.player = newPlayer;
        this.gamemode.onNewPlayer(newPlayer);
        this.logger.debug(`added a player with id ${id}`);
        return newPlayer;
    }

    /**
     * @param {number} id
     * @returns {boolean}
     */
    removePlayer(id) {
        if (!this.players.hasOwnProperty(id)) return false;
        this.gamemode.onPlayerDestroy(this.players[id]);
        this.players[id].destroy();
        this.players[id].exists = false;
        delete this.players[id];
        this.logger.debug(`removed player with id ${id}`);
        return true;
    }

    onTick() {
        this.stopwatch.begin();
        this.tick++;

        for (let id in this.worlds)
            this.worlds[id].update();
        this.listener.update();
        this.matchmaker.update();
        this.gamemode.onHandleTick();

        this.averageTickTime = this.stopwatch.elapsed();
        this.stopwatch.stop();
    }
}

module.exports = ServerHandle;

const Router = require("./sockets/Router");
const Gamemode = require("./gamemodes/Gamemode");
