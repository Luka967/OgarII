/** @interface */
class PlayingRouter {
    /**
     * @param {Listener} listener
     */
    constructor(listener) {
        this.listener = listener;
        this.isDisconnected = false;
        this.disconnectionTick = NaN;
        
        this.mouseX = 0;
        this.mouseY = 0;

        /** @type {String=} */
        this.spawningName = null;
        this.requestingSpectate = false;
        this.isPressingQ = false;
        this.hasProcessedQ = false;

        this.splitAttempts = 0;
        this.minionSplitAttempts = 0;
        this.ejectAttempts = 0;
        this.minionEjectAttempts = 0;

        this.player = null;
    }

    /** @abstract @returns {Boolean} */
    get isExternal() { throw new Error("Must be overriden"); }

    createPlayer() {
        this.player = this.listener.handle.createPlayer(this);
    }

    /** @virtual */
    onWorldSet() { }
    /** @virtual */
    onWorldReset() { }
    /** @param {PlayerCell} cell @virtual */
    onNewOwnedCell(cell) { }
    
    /** @virtual */
    onQPress() {
        if (this.hasProcessedQ) return;
        this.hasProcessedQ = true;
        if (this.player === null) return;
        this.listener.handle.gamemode.whenPlayerPressQ(this.player);
    }
    /** @virtual */
    attemptSplit() {
        if (this.player === null) return;
        this.listener.handle.gamemode.whenPlayerSplit(this.player);
    }
    /** @virtual */
    attemptEject() {
        if (this.player === null) return;
        this.listener.handle.gamemode.whenPlayerEject(this.player);
    }

    /** @abstract */
    close() {
        throw new Error("Must be overriden");
    }

    /** @abstract */
    sendUpdate() {
        throw new Error("Must be overriden");
    }
}

module.exports = PlayingRouter;

const Listener = require("../sockets/Listener");
const Player = require("../worlds/Player");
const PlayerCell = require("../cells/PlayerCell");