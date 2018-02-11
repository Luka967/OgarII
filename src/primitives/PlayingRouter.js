/** @interface */
class PlayingRouter {
    /**
     * @param {Listener} listener
     */
    constructor(listener) {
        this.listener = listener;
        this.isDisconnected = false;
        
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
        // TODO: pass thru gamemode
        this.player.updateState(2);
    }
    /** @virtual */
    attemptSplit() {
        // TODO: pass thru gamemode
        if (this.player.world !== null) this.player.world.splitPlayer(this.player);
    }
    /** @virtual */
    attemptEject() {
        // TODO: pass thru gamemode
        if (this.player.world !== null) this.player.world.ejectPlayer(this.player);
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