const Player = require("../worlds/Player");
const World = require("../worlds/World");
const Cell = require("./Cell");

class PlayerCell extends Cell {
    /**
     * @param {Player} owner
     * @param {Number} x
     * @param {Number} y
     * @param {Number} size
     * @param {({r: Number, g: Number, b: Number})} color
     * @param {String} name
     * @param {String} skin
     */
    constructor(owner, x, y, size, color, name, skin) {
        super(owner.world, x, y, size, color);
        this.owner = owner;
        this._name = name || "";
        this._skin = skin || "";
    }

    get type() { return 1; }
    get isSpiked() { return false; }
    get isAgitated() { return false; }
    get avoidWhenSpawning() { return true; }
}

module.exports = PlayerCell;