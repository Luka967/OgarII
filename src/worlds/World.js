const Player = require("./Player");

class World {
    constructor(handle, id) {
        this.handle = handle;
        this.id = id;

        /** @type {Cell[]} */
        this.cells = [];
        this.ejectedCells = [];
        this.playerCells = [];

        /** @type {Player[]} */
        this.players = [];
    }

    destroy() {
        
    }
}

module.exports = World;