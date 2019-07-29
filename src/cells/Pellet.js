const Misc = require("../primitives/Misc");
const Cell = require("./Cell");

class Pellet extends Cell {
    /**
     * @param {World} world
     * @param {Spawner} spawner
     * @param {number} x
     * @param {number} y
     */
    constructor(world, spawner, x, y) {
        const size = world.settings.pelletMinSize;
        super(world, x, y, size, Misc.randomColor());

        this.spawner = spawner;
        this.lastGrowTick = this.birthTick;
    }

    get type() { return 1; }
    get isSpiked() { return false; }
    get isAgitated() { return false; }
    get avoidWhenSpawning() { return false; }

    /**
     * @param {Cell} other
     * @returns {CellEatResult}
     */
    getEatResult() { return 0; }

    onTick() {
        super.onTick();
        if (this.size >= this.world.settings.pelletMaxSize) return;
        if (this.world.handle.tick - this.lastGrowTick > this.world.settings.pelletGrowTicks / this.world.handle.stepMult) {
            this.lastGrowTick = this.world.handle.tick;
            this.mass++;
        }
    }
    onSpawned() {
        this.spawner.pelletCount++;
    }
    onRemoved() {
        this.spawner.pelletCount--;
    }
}

module.exports = Pellet;

const World = require("../worlds/World");
