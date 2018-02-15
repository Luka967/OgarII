const Bot = require("./Bot");
const { throwIfBadNumber } = require("../primitives/Misc");

class PlayerBot extends Bot {
    /**
     * @param {World} world
     */
    constructor(world) {
        super(world);

        this.splitCooldownTicks = 0;
    }

    update() {
        if (this.splitCooldownTicks > 0) this.splitCooldownTicks--;
        this.player.updateVisibleCells();
        var player = this.player;
        if (player.state === -1) {
            this.spawningName = "Player bot";
            this.onSpawnRequest();
            this.spawningName = null;
        }

        /** @type {PlayerCell} */
        var cell = null;
        for (let i = 0, l = player.ownedCells.length; i < l; i++)
            if (cell === null || player.ownedCells[i] > cell.size)
                cell = player.ownedCells[i];
        if (cell === null) return; // ???

        var atMaxCells = player.ownedCells.length >= this.listener.settings.playerMaxCells;
        var willSplit = player.ownedCells.length <= 2;

        var mouseX = 0;
        var mouseY = 0;
        var bestPrey = null;
        var hasPredator = false;

        for (let id in player.visibleCells) {
            const check = player.visibleCells[id];
            let dx = check.x - cell.x;
            let dy = check.y - cell.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            let influence = 0;
            switch (check.type) {
                case 0:
                    if (player.id === check.owner.id) break;
                    if (player.team !== null && player.team === check.owner.team) break;
                    if (this.canEat(cell.size, check.size)) {
                        influence = check.size;
                        if (!this.canSplitkill(cell.size, check.size, d)) break;
                        if (bestPrey === null || check.size > bestPrey.size)
                            bestPrey = check;
                    } else if (this.canEat(check.size, cell.size)) {
                        influence = -1;
                        if (hasPredator || !this.canSplitkill(check.size, cell.size)) break;
                        hasPredator = true;
                    }
                    break;
                case 1: influence = 1; break;
                case 2:
                    if (atMaxCells) influence = check.size;
                    else influence = -1;
                    break;
                case 3: if (this.canEat(cell.size, check.size)) influence = check.size; break;
                case 4:
                    if (this.canEat(check.size, cell.size)) influence = -1;
                    else if (this.canEat(cell.size, check.size)) {
                        if (atMaxCells) influence = check.size;
                        else influence = -1;
                    }
                    break;
            }

            if (influence === 0) continue;
            dx /= d; dy /= d;
            if (influence < 0) d -= check.size;
            mouseX += dx * influence / d;
            mouseY += dy * influence / d;
        }

        if (willSplit && bestPrey !== null && bestPrey.size * 2 > cell.size && !hasPredator && this.splitCooldownTicks <= 0) {
            this.mouseX = bestPrey.x;
            this.mouseY = bestPrey.y;
            this.splitAttempts++;
            this.splitCooldownTicks = 25;
        } else {
            var d = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
            this.mouseX = cell.x + mouseX / (1 + d) * player.viewArea.w;
            this.mouseY = cell.y + mouseY / (1 + d) * player.viewArea.h;
        }
    }

    /**
     * @param {Number} aSize
     * @param {Number} bSize
     */
    canEat(aSize, bSize) {
        return aSize > bSize * 1.140175425099138;
    }
    /**
     * @param {Number} a
     * @param {Number} b
     * @param {Number} d
     */
    canSplitkill(aSize, bSize, d) {
        const splitD = Math.max(2 * aSize, this.listener.settings.playerSplitBoost);
        return aSize / 1.4142135623730951 > bSize * 1.140175425099138 && d - splitD <= aSize - bSize / 3;
    }
}

module.exports = PlayerBot;

const World = require("../worlds/World");
const Cell = require("../cells/Cell");
const PlayerCell = require("../cells/PlayerCell");