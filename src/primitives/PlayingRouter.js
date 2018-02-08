const Listener = require("../sockets/Listener");

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