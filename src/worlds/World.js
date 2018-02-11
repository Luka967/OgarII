const QuadTree = require("../primitives/QuadTree");
const Cell = require("../cells/Cell");
const Pellet = require("../cells/Pellet");
const EjectedCell = require("../cells/EjectedCell");
const PlayerCell = require("../cells/PlayerCell");

/**
 * @typedef {{x: Number, y: Number}} Position
 * @typedef {{r: Number, g: Number, b: Number}} Color
 * @typedef {{x: Number, y: Number, w: Number, h: Number}} Range
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
            x: this.settings.mapX,
            y: this.settings.mapY,
            w: this.settings.mapW,
            h: this.settings.mapH
        };
        this.finder = new QuadTree(
            this.border, 
            this.settings.finderMaxLevel,
            this.settings.finderMaxItems
        );

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
        cell.exists = true;
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
        if (cell.isBoosting)
            this.setCellAsNotBoosting(cell);
        cell.onRemoved();
        cell.exists = false;
    }

    /** @param {Player} player */
    addPlayer(player) {
        this.players.push(player);
        player.world = this;
        player.router.onWorldSet();
    }
    /** @param {Player} player */
    removePlayer(player) {
        this.players.push(this.players.indexOf(player), 1);
        player.world = null;
        player.router.onWorldReset();
    }

    /**
     * @param {Number} cellSize
     * @returns {Position}
     */
    getRandomPos(cellSize) {
        return {
            x: this.border.x - this.border.w + cellSize + Math.random() * (2 * this.border.w - cellSize),
            y: this.border.y - this.border.h + cellSize + Math.random() * (2 * this.border.h - cellSize),
        };
    }
    /**
     * @param {Range} range
     */
    isSafeSpawnPos(range) {
        return !this.finder.containsAny(range, /** @param {Cell} other */ (item) => item.avoidWhenSpawning);
    }
    /**
     * @param {Number} cellSize
     * @returns {Position}
     */
    getSafeSpawnPos(cellSize) {
        let tries = this.settings.safeSpawnTries;
        while (--tries >= 0) {
            const pos = this.getRandomPos(cellSize);
            if (this.isSafeSpawnPos({ x: pos.x, y: pos.y, w: cellSize, h: cellSize }))
                return pos;
        }
        return this.getRandomPos(cellSize);
    }
    /**
     * @param {Number} cellSize
     * @returns {{color: Color, pos: Position}}
     */
    getPlayerSpawnPos(cellSize) {
        if (this.settings.safeSpawnFromEjected > Math.random() && this.ejectedCells.length > 0) {
            let tries = this.settings.safeSpawnTries;
            while (--tries >= 0) {
                const cell = this.ejectedCells[~~(Math.random() * this.ejectedCells.length)];
                if (this.isSafeSpawnPos({ x: cell.x, y: cell.y, w: cellSize, h: cellSize }))
                    return { color: cell.color, pos: { x: cell.x, y: cell.y } };
            }
        }
        return { color: null, pos: this.getSafeSpawnPos(cellSize) };
    }

    /**
     * @param {Player} player
     * @param {Color} color
     * @param {Position} pos
     * @param {Number} size
     * @param {String} name
     * @param {String} skin
     */
    spawnPlayer(player, color, pos, size, name, skin) {
        const playerCell = new PlayerCell(player, pos.x, pos.y, size, color, name, skin);
        this.addCell(playerCell);
        player.updateState(0);
    }

    update() {
        const self = this;
        const eat = [], rigid = [];
        let i, l;

        // fire cell onTick
        for (i = 0, l = this.cells.length; i < l; i++)
            this.cells[i].onTick();
        
        // spawn passives
        while (this.pelletCount < this.settings.pelletCount)
            this.addCell(new Pellet(this));
        
        // boosting cell updates
        for (i = 0, l = this.boostingCells.length; i < l;) {
            if (!this.boostCell(this.boostingCells[i])) l--;
            else i++;
        }

        // boosting cell checks
        for (i = 0; i < this.boostingCells.length; i++) {
            const cell = this.boostingCells[i];
            if (cell.type !== 2 && cell.type !== 3) continue;
            this.finder.search(cell.range, /** @param {Cell} other */ (other) => {
                if (cell.id === other.id) return;
                switch (cell.getEatResult(other)) {
                    case 1: rigid.push(cell, other); break;
                    case 2: eat.push(cell, other); break;
                    case 3: eat.push(other, cell); break;
                }
            });
        }

        // player cell updates        
        for (i = 0, l = this.playerCells.length; i < l; i++) {
            const cell = this.playerCells[i];
            this.movePlayerCell(cell);
            this.decayPlayerCell(cell);
            this.bounceCell(cell);
            this.updateCell(cell);
        }

        // player cell checks
        for (i = 0; i < l; i++) {
            const cell = this.playerCells[i];
            this.finder.search(cell.range, /** @param {Cell} other */ (other) => {
                if (cell.id === other.id) return;
                switch (cell.getEatResult(other)) {
                    case 1: rigid.push(cell, other); break;
                    case 2: eat.push(cell, other); break;
                    case 3: eat.push(other, cell); break;
                }
            });
        }

        // resolve rigids
        for (i = 0, l = rigid.length; i < l;)
            this.resolveRigidCheck(rigid[i++], rigid[i++]);

        // resolve eats
        for (i = 0, l = eat.length; i < l;)
            this.resolveEatCheck(eat[i++], eat[i++]);

        // update players
        for (i = 0, l = this.players.length; i < l; i++) {
            const player = this.players[i];
            const router = player.router;
            while (router.splitAttempts > 0) {
                router.attemptSplit();
                router.splitAttempts--;
            }
            if (router.ejectAttempts > 0) {
                router.attemptEject();
                router.ejectAttempts = 0;
            }
            if (router.isPressingQ) router.onQPress();
            if (router.requestingSpectate) {
                player.updateState(1);
                router.requestingSpectate = false;
            }
            if (router.spawningName !== null) {
                this.handle.gamemode.onPlayerSpawnRequest(player, router.spawningName);
                router.spawningName = null;
            }
            player.updateVisibleCells();
        }
    }

    /**
     * @param {Cell} a
     * @param {Cell} b
     */
    resolveRigidCheck(a, b) {
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) { d = 1; dx = 1; dy = 0; }
        const m = a.size + b.size - d;
        if (m <= 0) return; dx /= d; dy /= d;
        const M = a.squareSize + b.squareSize;
        const aM = b.squareSize / M;
        const bM = a.squareSize / M;
        a.x -= dx * m * aM;
        a.y -= dy * m * aM;
        b.x += dx * m * bM;
        b.y += dy * m * bM;
        this.bounceCell(a);
        this.bounceCell(b);
        this.updateCell(a);
        this.updateCell(b);
    }

    /**
     * @param {Cell} a
     * @param {Cell} b
     */
    resolveEatCheck(a, b) {
        if (!a.exists || !b.exists) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > a.size - b.size / 3) return;
        a.whenAte(b);
        b.whenEatenBy(a);
        this.removeCell(b);
        this.updateCell(a);
    }

    /** @param {Cell} cell */
    boostCell(cell) {
        const d = cell.boost.d / 9;
        cell.x += cell.boost.dx * d;
        cell.y += cell.boost.dy * d;
        this.bounceCell(cell);
        this.updateCell(cell);
        if ((cell.boost.d -= d) >= 1) return true;
        this.setCellAsNotBoosting(cell);
        return false;
    }

    /** @param {Cell} cell */
    bounceCell(cell) {
        const r = cell.size / 2;
        const b = this.border;
        if (cell.x <= b.x - b.w + r) {
            cell.x = b.x - b.w + r;
            if (cell.isBoosting) cell.boost.dx = -cell.boost.dx;
        }
        if (cell.x >= b.x + b.w - r) {
            cell.x = b.x + b.w - r;
            if (cell.isBoosting) cell.boost.dx = -cell.boost.dx;
        }
        if (cell.y <= b.y - b.h + r) {
            cell.y = b.y - b.h + r;
            if (cell.isBoosting) cell.boost.dy = -cell.boost.dy;
        }
        if (cell.y >= b.y + b.h - r) {
            cell.y = b.y + b.h - r;
            if (cell.isBoosting) cell.boost.dy = -cell.boost.dy;
        }
    }

    /** @param {PlayerCell} cell */
    movePlayerCell(cell) {
        const router = cell.owner.router;
        if (router.isDisconnected) return;
        let dx = router.mouseX - cell.x;
        let dy = router.mouseY - cell.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) return; dx /= d; dy /= d;
        const m = Math.min(cell.moveSpeed, d);
        cell.x += dx * m;
        cell.y += dy * m;
    }
    /** @param {PlayerCell} cell */
    decayPlayerCell(cell) {
        const newSize = cell.size - cell.size * this.settings.playerDecayMult / 40;
        cell.size = Math.max(newSize, this.settings.playerMinSize);
    }
    /**
     * @param {PlayerCell} cell
     * @param {Number} size
     * @param {{dx: Number, dy: Number, d: Number}} boost
     */
    launchPlayerCell(cell, size, boost) {
        cell.squareSize -= size * size;
        const newCell = new PlayerCell(cell.owner, cell.x, cell.y, size, cell.color, cell.name, cell.skin);
        newCell.boost.dx = boost.dx;
        newCell.boost.dy = boost.dy;
        newCell.boost.d = boost.d;
        this.setCellAsBoosting(newCell);
        this.addCell(newCell);
    }

    /** @param {Player} player */
    splitPlayer(player) {
        const router = player.router;
        const l = player.ownedCells.length;
        for (let i = 0; i < l; i++) {
            if (player.ownedCells.length >= this.settings.playerMaxCells)
                break;
            const cell = player.ownedCells[i];
            if (cell.size < this.settings.playerMinSplitSize)
                continue;
            let dx = router.mouseX - cell.x;
            let dy = router.mouseY - cell.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d < 1) dx = 1, dy = 0, d = 1;
            else dx /= d, dy /= d;
            this.launchPlayerCell(cell, cell.size / 1.4142135623730952, {
                dx: dx,
                dy: dy,
                d: this.settings.playerSplitBoostSpeed
            });
        }
    }

    /** @param {Player} player */
    ejectPlayer(player) {
        const dispersion = this.settings.ejectDispersion;
        const loss = this.settings.ejectingLoss * this.settings.ejectingLoss;
        const router = player.router;
        const l = player.ownedCells.length;
        for (let i = 0; i < l; i++) {
            const cell = player.ownedCells[i];
            if (cell.size < this.settings.playerMinEjectSize)
                continue;
            let dx = router.mouseX - cell.x;
            let dy = router.mouseY - cell.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d < 1) dx = 1, dy = 0, d = 1;
            else dx /= d, dy /= d;
            const sx = cell.x + dx * cell.size;
            const sy = cell.y + dy * cell.size;
            const newCell = new EjectedCell(this, sx, sy, cell.color);
            const a = Math.atan2(dx, dy) - dispersion + Math.random() * 2 * dispersion;
            newCell.boost.dx = Math.sin(a);
            newCell.boost.dy = Math.cos(a);
            newCell.boost.d = this.settings.ejectedCellBoost;
            this.addCell(newCell);
            this.setCellAsBoosting(newCell);
            cell.squareSize -= loss;
            this.updateCell(cell);
        }
    }
}

module.exports = World;

const Player = require("./Player");
const ServerHandle = require("../ServerHandle");