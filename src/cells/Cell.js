const { throwIfBadNumber } = require("../primitives/Misc");

/** @abstract */
class Cell {
    /**
     * @param {World} world
     * @param {number} x
     * @param {number} y
     * @param {number} size
     * @param {Color} color
     */
    constructor(world, x, y, size, color) {
        this.world = world;
        throwIfBadNumber(x);
        throwIfBadNumber(y);
        throwIfBadNumber(size);

        this.id = world.nextCellId;
        this.birthTick = world.handle.tick;
        this.exists = false;

        this._x = x;
        this._y = y;
        this._size = size;
        this._color = color;
        /** @type {Range} */
        this.range = null;

        this.isBoosting = false;
        /** @type {Boost} */
        this.boost = {
            dx: 0,
            dy: 0,
            d: 0
        };

        /** @type {string} */
        this._name = this._skin = null;
        /** @type {Cell} */
        this.eatenBy = null;
        /** @type {Player} */
        this.owner = null;

        this.posChanged =
            this.sizeChanged =
            this.colorChanged =
            this.nameChanged =
            this.skinChanged =
            false;
    }

    /**
     * @abstract
     * @returns {number}
     */
    get type() { throw new Error("Must be overriden"); }
    /**
     * @abstract
     * @returns {boolean}
     */
    get isSpiked() { throw new Error("Must be overriden"); }
    /**
     * @abstract
     * @returns {boolean}
     */
    get isAgitated() { throw new Error("Must be overriden"); }
    /** 
     * @abstract
     * @returns {boolean}
    */
    get avoidWhenSpawning() { throw new Error("Must be overriden"); }
    /** @virtual */
    get shouldUpdate() {
        return this.posChanged || this.sizeChanged ||
            this.colorChanged || this.nameChanged || this.skinChanged;
    }

    get age() { return (this.world.handle.tick - this.birthTick) * this.world.handle.stepMult; }
    get x() { return this._x; }
    get y() { return this._y; }
    /** @param {number} value */
    set x(value) { throwIfBadNumber(value); this._x = value; this.posChanged = true; }
    /** @param {number} value */
    set y(value) { throwIfBadNumber(value); this._y = value; this.posChanged = true; }

    get size() { return this._size; }
    /** @param {number} value */
    set size(value) { throwIfBadNumber(value); this._size = value; this.sizeChanged = true; }

    get squareSize() { return this.size * this.size; }
    /** @param {number} value */
    set squareSize(value) { this.size = Math.sqrt(value); }

    get mass() { return this.size * this.size / 100; }
    /** @param {number} value */
    set mass(value) { this.size = Math.sqrt(100 * value); }

    get color() { return this._color; }
    /** @param {Color} value */
    set color(value) { this._color = value; this.colorChanged = true; }

    get name() { return this._name; }
    /** @param {string} value */
    set name(value) { this._name = value; this.nameChanged = true; }

    get skin() { return this._skin; }
    /** @param {string} value */
    set skin(value) { this._skin = value; this.skinChanged = true; }

    /**
     * @param {Cell} other
     * @returns {CellEatResult}
     */
    getEatResult(other) {
        throw new Error("Must be overriden");
    }

    /** @virtual */
    onSpawned() { }
    /** @virtual */
    onTick() {
        this.posChanged =
            this.sizeChanged =
            this.colorChanged =
            this.nameChanged =
            this.skinChanged =
            false;
    }
    /** @param {Cell} other @virtual */
    whenAte(other) {
        this.squareSize += other.squareSize;
    }
    /** @param {Cell} other @virtual */
    whenEatenBy(other) {
        this.eatenBy = other;
    }
    /** @virtual */
    onRemoved() { }
}

module.exports = Cell;

const World = require("../worlds/World");
const Player = require("../worlds/Player");
