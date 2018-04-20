const Cell = require("./Cell");
const Pellet = require("./Pellet");

class Mothercell extends Cell {
    /**
     * @param {World} world
     */
    constructor(world, x, y) {
        const size = world.settings.mothercellSize;
        super(world, x, y, size, { r: 206, g: 99, b: 99 });

        this.pelletCount = 0;
    }

    get type() { return 4; }
    get isSpiked() { return true; }
    get isAgitated() { return false; }
    get avoidWhenSpawning() { return true; }

    getEatResult(other) { return 0; }

    onTick() {
        const settings = this.world.settings;
        const mothercellSize = settings.mothercellSize;
        const pelletSize = settings.pelletMinSize;
        const minSpawnSqSize = mothercellSize * mothercellSize + pelletSize * pelletSize;
        const l = settings.mothercellActiveSpawnSpeed;
        for (let i = 0; i < l && this.squareSize > minSpawnSqSize; i++) {
            this.spawnPellet();
            this.squareSize -= pelletSize * pelletSize;
        }
        if (this.pelletCount < settings.mothercellMaxPellets && Math.random() < settings.mothercellPassiveSpawnChance)
            this.spawnPellet();
    }
    spawnPellet() {
        const angle = Math.random() * 2 * Math.PI;
        const x = this.x + this.size * Math.sin(angle);
        const y = this.y + this.size * Math.cos(angle);
        const pellet = new Pellet(this.world, this, x, y);
        pellet.boost.dx = Math.sin(angle);
        pellet.boost.dy = Math.cos(angle);
        const d = this.world.settings.mothercellPelletBoost;
        pellet.boost.d = d / 2 + Math.random() * d / 2;
        this.world.addCell(pellet);
        this.world.setCellAsBoosting(pellet);
    }

    onSpawned() {
        this.world.mothercellCount++;
    }
    whenAte(cell) {
        super.whenAte(cell);
        this.size = Math.min(this.size, this.world.settings.mothercellMaxSize);
    }
    /**
     * @param {Cell} cell
     */
    whenEatenBy(cell) {
        super.whenEatenBy(cell);
        if (cell.type === 0) this.world.popPlayerCell(cell);
    }
    onRemoved() {
        this.world.mothercellCount--;
    }
}

module.exports = Mothercell;

const World = require("../worlds/World");