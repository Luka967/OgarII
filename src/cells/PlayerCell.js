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

    get moveSpeed() {
        return 88 * Math.pow(this.size, -0.4396754) * this.owner.settings.playerMoveSpeed;
    }

    get type() { return 1; }
    get isSpiked() { return false; }
    get isAgitated() { return false; }
    get avoidWhenSpawning() { return true; }

    onSpawned() {
        this.owner.router.onNewOwnedCell(this);
        this.owner.ownedCells.push(this);
        this.world.playerCells.push(this);
    }

    onRemoved() {
        this.world.playerCells.splice(this.world.playerCells.indexOf(this), 1);
        this.owner.ownedCells.splice(this.owner.ownedCells.indexOf(this), 1);
        this.owner.updateState(-1);
    }
}

module.exports = PlayerCell;