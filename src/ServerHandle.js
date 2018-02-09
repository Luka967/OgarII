const World = require("./worlds/World");
const Listener = require("./sockets/Listener");
const Settings = require("./Settings");
const Ticker = require("./primitives/Ticker");
const Logger = require("./primitives/Logger");

class ServerHandle {
    /**
     * @param {Settings} settings
     */
    constructor(settings) {
        /** @type {Settings} */
        this.settings = Object.assign(Object.create(Settings), settings);
        this.listener = new Listener(this);
        /** @type {{[id: string]: World}} */
        this.worlds = { };
        this.ticker = new Ticker(40);
        this.ticker.add(this._onTick.bind(this));
        this.logger = new Logger();

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
    addWorld() {
        let id = 0;
        while (this.worlds.hasOwnProperty(++id)) ;
        let newWorld = new World(this, id);
        this.worlds[id] = newWorld;
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
        return true;
    }

    _onTick() {
        this.tick++;
        for (let id in this.worlds) this.worlds[id].update();
        this.listener.update();
    }
}

module.exports = ServerHandle;