const Cell = require("./Cell");

class Virus extends Cell {
    /**
     * @param {World} world
     * @param {Cell=} spawner
     * @param {Number=} x
     * @param {Number=} y
     */
    constructor(world, spawner, x, y) {
        spawner = spawner || null;

        const size = world.settings.virusMinSize;
        const pos = world.getRandomPos(size);
        super(world, pos.x, pos.y, size, {
            r: 0x33,
            g: 0xff,
            b: 0x33
        });

        this.spawner = spawner;
        this.lastGrowTick = this.birthTick;
    }

    get type() {
        return 2;
    }
    get isSpiked() {
        return true;
    }
    get isAgitated() {
        return false;
    }
    get avoidWhenSpawning() {
        return true;
    }

    whenEatenBy(other) {
        if (other.type != 0)
            return;

        let dx = Math.floor(2 * Math.PI * Math.random()) - other.x;
        let dy = Math.floor(2 * Math.PI * Math.random()) - other.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) dx = 1, dy = 0, d = 1;
        else dx /= d, dy /= d;

        for (let i = 0; i < this.world.settings.playerMaxCells / 2; i++) {
            this.world.launchPlayerCell(other, other.size / 2, {
                dx: dx,
                dy: dy,
                d: this.world.settings.playerSplitBoostSpeed
            })
        }

    }

    whenAte(other) {
        if (other.type != 3)
            return;
        else
            this.squareSize += other.squareSize;


        if (this._size >= this.world.settings.virusMaxSize) {
            this._size = this.world.settings.virusMinSize;
        }
    }

    onSpawned() {
        if (this.spawner === null) this.world.virusCount++;
        else this.spawner.viruses.push(this);
    }
    onRemoved() {
        if (this.spawner === null) this.world.virusCount--;
        else this.spawner.viruses.splice(this.spawner.viruses.indexOf(this), 1);
    }
}

module.exports = Virus;