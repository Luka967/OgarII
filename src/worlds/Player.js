const PlayingRouter = require("../primitives/PlayingRouter");
const ServerHandle = require("../ServerHandle");

class Player {
    /**
     * @param {ServerHandle} handle
     * @param {PlayingRouter} playingRouter
     */
    constructor(handle, playingRouter) {
        this.handle = handle;
        this.playingRouter = playingRouter;
    }
}

module.exports = Player;