const { intersects, fullyIntersects, getQuadIntersect, getQuadFullIntersect } = require("../primitives/Misc");

/**
 * @template T
 * @typedef {T & { __root: QuadTree<T>, range: Rect }} QuadItem
 *
 * @typedef {-1 | 0 | 1 | 2 | 3} DefiniteQuad
 */

/**
 * @template T
 */
class QuadTree {
    /**
     * @param {Rect} range
     * @param {number} maxLevel
     * @param {number} maxItems
     * @param {QuadTree<T>=} root
     */
    constructor(range, maxLevel, maxItems, root) {
        this.root = root;
        /** @type {number} */
        this.level = root ? root.level + 1 : 1;

        this.maxLevel = maxLevel;
        this.maxItems = maxItems;
        this.range = range;

        /** @type {QuadItem<T>[]} */
        this.items = [];
        this.hasSplit = false;
    }

    destroy() {
        for (let i = 0, l = this.items.length; i < l; i++)
            delete this.items[i].__root;
        if (!this.hasSplit) return;
        for (i = 0; i < 4; i++) this.branches[i].destroy();
    }
    /**
     * @param {QuadItem<T>} item
     */
    insert(item) {
        let quad = this;
        while (true) {
            if (!quad.hasSplit) break;
            const quadrant = quad.getQuadrant(item.range);
            if (quadrant === -1) break;
            quad = quad.branches[quadrant];
        }
        item.__root = quad;
        quad.items.push(item);
        quad.split();
    }
    /**
     * @param {QuadItem<T>} item
     */
    update(item) {
        const oldQuad = item.__root;
        let newQuad = item.__root;
        while (true) {
            if (!newQuad.root) break;
            newQuad = newQuad.root;
            if (fullyIntersects(newQuad.range, item.range)) break;
        }
        while (true) {
            if (!newQuad.hasSplit) break;
            const quadrant = newQuad.getQuadrant(item.range);
            if (quadrant === -1) break;
            newQuad = newQuad.branches[quadrant];
        }
        if (oldQuad === newQuad) return;
        oldQuad.items.splice(oldQuad.items.indexOf(item), 1);
        newQuad.items.push(item);
        item.__root = newQuad;
        oldQuad.merge();
        newQuad.split();
    }
    /**
     * @param {QuadItem<T>} item
     */
    remove(item) {
        const quad = item.__root;
        quad.items.splice(quad.items.indexOf(item), 1);
        delete item.__root;
        quad.merge();
    }

    /**
     * @private
     */
    split() {
        if (this.hasSplit || this.level > this.maxLevel || this.items.length < this.maxItems) return;
        this.hasSplit = true;
        const x = this.range.x;
        const y = this.range.y;
        const hw = this.range.w / 2;
        const hh = this.range.h / 2;
        /** @type {QuadTree<T>[]} */
        this.branches = [
            new QuadTree({ x: x - hw, y: y - hh, w: hw, h: hh }, this.maxLevel, this.maxItems, this),
            new QuadTree({ x: x + hw, y: y - hh, w: hw, h: hh }, this.maxLevel, this.maxItems, this),
            new QuadTree({ x: x - hw, y: y + hh, w: hw, h: hh }, this.maxLevel, this.maxItems, this),
            new QuadTree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.maxLevel, this.maxItems, this)
        ];
        for (let i = 0, l = this.items.length, quadrant; i < l; i++) {
            quadrant = this.getQuadrant(this.items[i].range);
            if (quadrant === -1) continue;
            delete this.items[i].__root;
            this.branches[quadrant].insert(this.items[i]);
            this.items.splice(i, 1); i--; l--;
        }
    }
    /**
     * @private
     */
    merge() {
        let quad = this;
        while (quad != null) {
            if (!quad.hasSplit) { quad = quad.root; continue; }
            for (let i = 0, branch; i < 4; i++)
                if ((branch = quad.branches[i]).hasSplit || branch.items.length > 0)
                    return;
            quad.hasSplit = false;
            delete quad.branches;
        }
    }

    /**
     * @param {Rect} range
     * @param {(item: QuadItem<T>) => void} callback
     */
    search(range, callback) {
        for (let i = 0, l = this.items.length, item; i < l; i++)
            if (intersects(range, (item = this.items[i]).range)) callback(item);
        if (!this.hasSplit) return;
        const quad = getQuadIntersect(range, this.range);
        if (quad.t) {
            if (quad.l) this.branches[0].search(range, callback);
            if (quad.r) this.branches[1].search(range, callback);
        }
        if (quad.b) {
            if (quad.l) this.branches[2].search(range, callback);
            if (quad.r) this.branches[3].search(range, callback);
        }
    }
    /**
     * @param {Rect} range
     * @param {(item: QuadItem<T>) => boolean} selector
     * @returns {boolean}
     */
    containsAny(range, selector) {
        for (let i = 0, l = this.items.length, item; i < l; i++)
            if (intersects(range, (item = this.items[i]).range) && (!selector || selector(item)))
                return true;
        if (!this.hasSplit) return false;
        const quad = getQuadIntersect(range, this.range);
        if (quad.t) {
            if (quad.l && this.branches[0].containsAny(range, selector)) return true;
            if (quad.r && this.branches[1].containsAny(range, selector)) return true;
        }
        if (quad.b) {
            if (quad.l && this.branches[2].containsAny(range, selector)) return true;
            if (quad.r && this.branches[3].containsAny(range, selector)) return true;
        }
        return false;
    }

    /** @returns {QuadItem<T>[]} */
    getItemCount() {
        if (!this.hasSplit) return this.items.length;
        else return this.items.length +
            this.branches[0].getItemCount() +
            this.branches[1].getItemCount() +
            this.branches[2].getItemCount() +
            this.branches[3].getItemCount();
    }
    /** @returns {number} */
    getBranchCount() {
        if (this.hasSplit)
            return 1 +
                this.branches[0].getBranchCount() + this.branches[1].getBranchCount() +
                this.branches[2].getBranchCount() + this.branches[3].getBranchCount();
        return 1;
    }
    /**
     * @returns {string}
     */
    debugStr() {
        let str = `items ${this.items.length}/${this.maxItems}/${this.getItemCount()} level ${this.level} x ${this.range.x} y ${this.range.y} w ${this.range.w} h ${this.range.h}\n`;
        if (this.hasSplit) {
            str += new Array(1 + this.level * 2).join(" ") + this.branches[0].debugStr();
            str += new Array(1 + this.level * 2).join(" ") + this.branches[1].debugStr();
            str += new Array(1 + this.level * 2).join(" ") + this.branches[2].debugStr();
            str += new Array(1 + this.level * 2).join(" ") + this.branches[3].debugStr();
        }
        return str;
    }

    /**
     * @param {Rect} a
     * @returns {DefiniteQuad}
     */
    getQuadrant(a) {
        const quad = getQuadFullIntersect(a, this.range);
        if (quad.t) {
            if (quad.l) return 0;
            if (quad.r) return 1;
        }
        if (quad.b) {
            if (quad.l) return 2;
            if (quad.r) return 3;
        }
        return -1;
    }
}

module.exports = QuadTree;
