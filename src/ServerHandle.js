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
        /** @type {Listener} */
        this.listener = null;
        /** @type {{[id: string]: World}} */
        this.worlds = { };
        this.ticker = new Ticker(40);
        this.ticker.add(this._onTick.bind(this));
        this.logger = new Logger();
    }

    start() {
        this.logger.inform("starting");
        this.listener = new Listener(this);
        this.listener.open();
        this.ticker.begin();
        this.logger.inform("ticker begin");
    }

    stop() {

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

    }
}

module.exports = ServerHandle;