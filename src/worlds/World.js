const ServerHandle = require("../ServerHandle");
const QuadTree = require("../primitives/QuadTree");
const Player = require("./Player");
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

        this.map = {
            x: this.settings.worldMapX,
            y: this.settings.worldMapY,
            w: this.settings.worldMapW,
            h: this.settings.worldMapH
        };
        this.finder = new QuadTree(
            this.map, 
            this.settings.worldFinderMaxLevel,
            this.settings.worldFinderMaxItems
        );
        /** @type {{[tick: string]: Cell[]}} */
        this.cellUpdateQueue = { };
    }

    get settings() { return this.handle.settings; }

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

    /** @returns {Position} */
    getRandomPos() {
        return {
            x: this.map.x - this.map.w + 2 * Math.random() * this.map.w,
            y: this.map.y - this.map.h + 2 * Math.random() * this.map.h,
        };
    }
    /** @returns {Position} */
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
            
        }
    }
}

module.exports = World;