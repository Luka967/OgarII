const Cell = require("./Cell");

class Virus extends Cell {
    /**
     * @param {World} world
     * @param {Number=} x
     * @param {Number=} y
     */
    constructor(world, x, y) {
        const size = world.settings.virusSize;
        if (x === undefined) {
            const pos = world.getSafeSpawnPos(size);
            x = pos.x;
            y = pos.y;
        }
        super(world, x, y, size, { r: 51, g: 255, b: 51 });

        this.fedTimes = 0;
    }

    get type() { return 2; }
    get isSpiked() { return true; }
    get isAgitated() { return false; }
    get avoidWhenSpawning() { return true; }

    /**
     * @param {Cell} other
     * @returns {(0|1|2|3)} 0 for none, 1 for rigid, 2 for eat, 3 for inverted eat
     */
    getEatResult(other) {
        if (other.type === 3 && this.world.virusCount < this.world.settings.virusMaxCount)
            return 2;
        if (other.type === 4) return 3;
        return 0;
    }

    onSpawned() {
        this.world.virusCount++;
    }

    /**
     * @param {Cell} cell
     */
    whenAte(cell) {
        const settings = this.world.settings;
        if (settings.virusPushing) {
            const newD = this.boost.d + settings.virusPushBoost;
            this.boost.dx = (this.boost.dx * this.boost.d + cell.boost.dx * settings.virusPushBoost) / newD;
            this.boost.dy = (this.boost.dy * this.boost.d + cell.boost.dy * settings.virusPushBoost) / newD;
            this.boost.d = newD;
            this.world.setCellAsBoosting(this);
        } else {
            this.boost.dx = cell.boost.dx;
            this.boost.dy = cell.boost.dy;
            if (++this.fedTimes >= settings.virusFeedTimes) {
                this.fedTimes = 0;
                this.size = settings.virusSize;
                this.world.splitVirus(this);
            } else super.whenAte(cell);
        }
    }

    /**
     * @param {Cell} cell
     */
    whenEatenBy(cell) {
        if (cell.type === 0) this.world.popPlayerCell(cell);
    }

    onRemoved() {
        this.world.virusCount--;
    }
}

module.exports = Virus;

const World = require("../worlds/World");