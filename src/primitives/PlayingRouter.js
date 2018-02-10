/** @interface */
class PlayingRouter {
    /**
     * @param {Listener} listener
     */
    constructor(listener) {
        this.listener = listener;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isEjecting = false;
        this.splitAttempts = 0;
        this.isMinionEjecting = false;
        this.minionSplitAttempts = 0;

        this.player = null;
    }

    createPlayer() {
        this.player = this.listener.handle.createPlayer(this);
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