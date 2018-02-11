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
        this._canMerge = false;
    }

    get moveSpeed() {
        return 88 * Math.pow(this.size, -0.4396754) * this.owner.settings.playerMoveSpeed;
    }
    get canMerge() { return this._canMerge; }

    get type() { return 0; }
    get isSpiked() { return false; }
    get isAgitated() { return false; }
    get avoidWhenSpawning() { return true; }

    /**
     * @param {PlayerCell|Cell} other
     * @returns {(0|1|2|3)} 0 for none, 1 for rigid, 2 for eat, 3 for inverted eat
     */
    getEatResult(other) {
        if (other.type === 0) {
            const delay = this.world.settings.playerNoCollideDelay;
            if (other.owner.id === this.owner.id) {
                if (other.age < delay || this.age < delay) return 0;
                if (this.canMerge && other.canMerge) return 2;
                return 1;
            }
            if (other.owner.team === this.owner.team && this.owner.team !== null)
                return (other.age < delay || this.age < delay) ? 0 : 1;
            return this.getDefaultEatResult(other);
        }
        if (other.type === 4 && other.size > this.size) return 3;
        if (other.type === 1) return 2;
        return this.getDefaultEatResult(other);
    }
    /** @param {Cell} other */
    getDefaultEatResult(other) {
        return other.size * 1.14075183 > this.size ? 0 : 2;
    }

    onTick() {
        super.onTick();
        const settings = this.world.settings;
        const delay = settings.playerMergeTime === 0
            ? settings.playerNoMergeDelay
            : ~~(settings.playerMergeTime + this.mass * settings.playerMergeTimeIncrease) * 25;
        this._canMerge = this.age >= delay;
    }

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

const World = require("../worlds/World");
const Player = require("../worlds/Player");