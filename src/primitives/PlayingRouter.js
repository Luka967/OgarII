/** @interface */
class PlayingRouter {
    /**
     * @param {Listener} listener
     */
    constructor(listener) {
        this.listener = listener;
        this.disconnected = false;
        this.disconnectionTick = NaN;
        
        this.mouseX = 0;
        this.mouseY = 0;

        /** @type {string=} */
        this.spawningName = null;
        this.requestingSpectate = false;
        this.isPressingQ = false;
        this.hasProcessedQ = false;
        this.splitAttempts = 0;
        this.ejectAttempts = 0;

        this.hasPlayer = false;
        this.player = null;
        this.listener.addPlayingRouter(this);
    }

    /** @abstract @returns {boolean} */
    get isExternal() { throw new Error("Must be overriden"); }
    /** @abstract @returns {boolean} */
    static get separateInTeams() { throw new Error("Must be overriden"); }
    /** @returns {boolean} */
    get separateInTeams() { return this.constructor.separateInTeams; }

    get handle() { return this.listener.handle; }
    get logger() { return this.listener.handle.logger; }
    get settings() { return this.listener.handle.settings; }

    createPlayer() {
        if (this.hasPlayer) return;
        this.hasPlayer = true;
        this.player = this.listener.handle.createPlayer(this);
    }
    destroyPlayer() {
        if (!this.hasPlayer) return;
        this.hasPlayer = false;
        this.listener.handle.removePlayer(this.player.id);
        this.player = null;
    }

    /** @virtual */
    onWorldSet() { }
    /** @virtual */
    onWorldReset() { }
    /** @param {PlayerCell} cell @virtual */
    onNewOwnedCell(cell) { }
    
    /** @virtual */
    onSpawnRequest() {
        if (!this.hasPlayer) return;
        this.listener.handle.gamemode.onPlayerSpawnRequest(this.player, this.spawningName);
    }
    /** @virtual */
    onSpectateRequest() {
        if (!this.hasPlayer) return;
        this.player.updateState(1);
    }
    /** @virtual */
    onQPress() {
        if (!this.hasPlayer) return;
        this.listener.handle.gamemode.whenPlayerPressQ(this.player);
    }
    /** @virtual */
    attemptSplit() {
        if (!this.hasPlayer) return;
        this.listener.handle.gamemode.whenPlayerSplit(this.player);
    }
    /** @virtual */
    attemptEject() {
        if (!this.hasPlayer) return;
        this.listener.handle.gamemode.whenPlayerEject(this.player);
    }

    /** @virtual */
    close() {
        this.listener.removePlayingRouter(this);
    }

    /** @abstract @returns {boolean} */
    get shouldClose() {
        throw new Error("Must be overriden");
    }
    /** @abstract */
    update() {
        throw new Error("Must be overriden");
    }
}

module.exports = PlayingRouter;

const Listener = require("../sockets/Listener");
const Player = require("../worlds/Player");
const PlayerCell = require("../cells/PlayerCell");