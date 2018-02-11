const Cell = require("./Cell");

class EjectedCell extends Cell {
    /**
     * @param {World} world
     * @param {Number} x
     * @param {Number} y
     * @param {{r: Number, g: Number, b: Number}} color
     */
    constructor(world, x, y, color) {
        const size = world.settings.ejectedSize;
        super(world, x, y, size, color);
    }

    get type() { return 3; }
    get isSpiked() { return false; }
    get isAgitated() { return false; }
    get avoidWhenSpawning() { return false; }

    /**
     * @param {Cell} other
     * @returns {(0|1|2|3)} 0 for none, 1 for rigid, 2 for eat, 3 for inverted eat
     */
    getEatResult(other) {
        if (other.type === 2 || other.type === 4) return 3;
        if (other.type === 3) {
            if (!other.isBoosting) other.world.setCellAsBoosting(other);
            return 1;
        }
        return 0;
    }

    onSpawned() {
        this.world.ejectedCells.push(this);
    }
    onRemoved() {
        this.world.ejectedCells.splice(this.world.ejectedCells.indexOf(this), 1);
    }
}

module.exports = EjectedCell;

const World = require("../worlds/World");