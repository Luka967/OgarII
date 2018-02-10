const QuadTree = require("../primitives/QuadTree");
const Cell = require("../cells/Cell");
const Pellet = require("../cells/Pellet");

/**
 * @typedef {{x: Number, y: Number}} Position
 */

class World {
    /**
     * @param {ServerHandle} handle
     * @param {Number} id
     */
    constructor(handle, id) {
        this.handle = handle;
        this.id = id;

        this._nextCellId = 1;
        /** @type {Cell[]} */
        this.cells = [];
        /** @type {Cell[]} */
        this.boostingCells = [];
        this.pelletCount = 0;
        /** @type {EjectedCell[]} */
        this.ejectedCells = [];
        /** @type {PlayerCell[]} */
        this.playerCells = [];

        /** @type {Player[]} */
        this.players = [];
        /** @type {Player=} */
        this.largestPlayer = null;

        /** @type {{x: Number, y: Number, w: Number, h: Number}} */
        this.border = {
            x: this.settings.worldMapX,
            y: this.settings.worldMapY,
            w: this.settings.worldMapW,
            h: this.settings.worldMapH
        };
        this.finder = new QuadTree(
            this.border, 
            this.settings.worldFinderMaxLevel,
            this.settings.worldFinderMaxItems
        );
        /** @type {{[tick: string]: Cell[]}} */
        this.cellUpdateQueue = { };

        this.stats = {
            limit: -1,
            players: -1,
            playing: -1,
            spectating: -1,
            bots: -1,
            loadTime: 0,
            uptime: 0
        };
    }

    get settings() { return this.handle.settings; }
    get nextCellId() {
        return this._nextCellId === 4294967296 ? (this._nextCellId = 1) : this._nextCellId++;
    }

    destroy() {
        
    }

    /** @param {Cell} cell */
    addCell(cell) {
        cell.range = {
            x: cell.x,
            y: cell.y,
            w: cell.size,
            h: cell.size
        };
        this.cells.push(cell);
        this.finder.insert(cell);
        cell.onSpawned();
    }
    /**
     * @param {Cell} cell
     * @param {Number} tick
     */
    queueCellForUpdate(cell, tick) {
        (this.cellUpdateQueue[tick] || (this.cellUpdateQueue[tick] = [])).push(cell);
    }
    /** @param {Cell} cell */
    setCellAsBoosting(cell) {
        if (cell.isBoosting) return false;
        cell.isBoosting = true;
        this.boostingCells.push(cell);
        return true;
    }
    /** @param {Cell} cell */
    setCellAsNotBoosting(cell) {
        if (!cell.isBoosting) return false;
        cell.isBoosting = false;
        this.boostingCells.splice(this.boostingCells.indexOf(cell), 1);
        return true;
    }
    /** @param {Cell} cell */
    updateCell(cell) {
        cell.range.x = cell.x;
        cell.range.y = cell.y;
        cell.range.w = cell.size;
        cell.range.h = cell.size;
        this.finder.update(cell);
    }
    /** @param {Cell} cell */
    removeCell(cell) {
        this.finder.remove(cell);
        delete cell.range;
        this.cells.splice(this.cells.indexOf(cell), 1);
        cell.onRemoved();
    }

    /** @param {Player} player */
    addPlayer(player) {
        this.players.push(player);
        player.world = this;
    }
    /** @param {Player} player */
    removePlayer(player) {
        this.players.push(this.players.indexOf(player), 1);
        player.world = null;
    }

    /** @returns {Position} */
    getRandomPos() {
        return {
            x: this.border.x - this.border.w + 2 * Math.random() * this.border.w,
            y: this.border.y - this.border.h + 2 * Math.random() * this.border.h,
        };
    }
    /**
     * @param {Number} cellSize
     * @returns {Position}
     */
    getSafeSpawnPos(cellSize) {
        let tries = this.settings.worldSafeSpawnTries;
        while (--tries >= 0) {
            const pos = this.getRandomPos();
            if (!this.finder.containsAny({ x: pos.x, y: pos.y, w: cellSize, h: cellSize }, (item) => item.avoidWhenSpawning))
                return pos;
        }
        return this.getRandomPos();
    }

    update() {
        const self = this;
        const eat = [], rigid = [];
        let i, l;

        // fire cell onTick
        const updatingThisTick = this.cellUpdateQueue[this.handle.tick];
        if (updatingThisTick !== undefined) {
            for (i = 0, l = updatingThisTick.length; i < l; i++)
                updatingThisTick[i].onTick();
            delete this.cellUpdateQueue[this.handle.tick];
        }
        
        // spawn passives
        while (this.pelletCount < this.settings.pelletCount)
            this.addCell(new Pellet(this));
        
        for (i = 0, l = this.players.length; i < l; i++) {
            const player = this.players[i];
            player.updateVisibleCells();
        }
    }
}

module.exports = World;

const Player = require("./Player");
const ServerHandle = require("../ServerHandle");