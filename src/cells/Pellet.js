const World = require("../worlds/World");
const Misc = require("../primitives/Misc");
const Cell = require("./Cell");

class Pellet extends Cell {
    /**
     * @param {World} world
     * @param {Cell=} spawner
     * @param {Number=} x
     * @param {Number=} y
     */
    constructor(world, spawner, x, y) {
        spawner = spawner || null;
        if (spawner === null) {
            const pos = world.getRandomPos();
            super(world, pos.x, pos.y, world.settings.pelletMinSize, Misc.randomColor());
        } else super(world, x, y, world.settings.pelletMinSize, Misc.randomColor());
        
        this.spawner = spawner;
        this.lastGrowTick = this.birthTick;
    }

    get type() { return 1; }
    get avoidWhenSpawning() { return false; }

    getEatResult() { return 0; }

    onSpawned() {
        if (this.spawner === null) this.world.pelletCount++;
        else this.spawner.pellets.push(this);
    }
    onRemoved() {
        if (this.spawner === null) this.world.pelletCount--;
        else this.spawner.pellets.splice(this.spawner.pellets.indexOf(this), 1);
    }
}

module.exports = Pellet;