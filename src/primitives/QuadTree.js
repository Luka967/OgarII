/**
 * @typedef {{x: Number, y: Number, w: Number, h: Number}} Range
 * @typedef {{__root: undefined, range: Range}} QuadItem
 * @typedef {{__root: QuadTree, range: Range}} InsertedQuadItem
*/

class QuadTree {
    /**
     * @param {Range} range
     * @param {Number} maxLevel
     * @param {Number} maxItems
     * @param {QuadTree=} root 
     */
    constructor(range, maxLevel, maxItems, root) {
        this.root = root;
        /** @type {Number} */
        this.level = root ? root.level + 1 : 1;

        this.maxLevel = maxLevel;
        this.maxItems = maxItems;
        this.range = range;

        /** @type {InsertedQuadItem[]} */
        this.items = [];
        this.hasSplit = false;
    }

    /** 
     * @param {QuadItem} item
     */
    insert(item) {
        var quad = this;
        while (true) {
            if (!quad.hasSplit) break;
            var quadrant = quad.getQuadrant(item.range);
            if (quadrant === -1) break;
            quad = quad.branches[quadrant];
        }
        item.__root = quad;
        quad.items.push(item);
        if (!quad.hasSplit && quad.level <= quad.maxLevel && quad.items.length >= quad.maxItems)
            quad.split();
    }

    /** 
     * @param {InsertedQuadItem} item
     */
    update(item) {
        var oldQuad = item.__root;
        var newQuad = item.__root;
        while (true) {
            if (!newQuad.root) break;
            newQuad = newQuad.root;
            if (fullyIntersects(newQuad.range, item)) break;
        }
        while (true) {
            if (!newQuad.hasSplit) break;
            var quadrant = newQuad.getQuadrant(item.range);
            if (quadrant === -1) break;
            newQuad = newQuad.branches[quadrant];
        }
        if (oldQuad === newQuad) return;
        oldQuad.items.splice(oldQuad.items.indexOf(item), 1);
        newQuad.items.push(item);
        item.__root = newQuad;
        if (oldQuad.root) oldQuad.root.merge();
        if (!newQuad.hasSplit && newQuad.level <= newQuad.maxLevel && newQuad.items.length >= newQuad.maxItems)
            newQuad.split();
    }

    /** 
     * @param {InsertedQuadItem} item
     */
    remove(item) {
        var quad = item.__root;
        var i = quad.items.indexOf(item);
        if (i === -1) throw new Error("item not found");
        quad.items.splice(i, 1);
        delete item.__root;
        if (quad.root) quad.root.merge();
    }

    /** 
     * @private
     */
    split() {
        this.hasSplit = true;
        var x = this.range.x;
        var y = this.range.y;
        var hw = this.range.w / 2;
        var hh = this.range.h / 2;
        this.branches = [
            new QuadTree({ x: x - hw, y: y - hh, w: hw, h: hh }, this.maxLevel, this.maxItems, this),
            new QuadTree({ x: x + hw, y: y - hh, w: hw, h: hh }, this.maxLevel, this.maxItems, this),
            new QuadTree({ x: x - hw, y: y + hh, w: hw, h: hh }, this.maxLevel, this.maxItems, this),
            new QuadTree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.maxLevel, this.maxItems, this)
        ];
        for (var i = 0, l = this.items.length; i < l; i++) {
            var quadrant = this.getQuadrant(this.items[i].range);
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
        var quad = this;
        while (quad !== null) {
            if (!this.hasSplit) return;
            for (var i = 0; i < 4; i++)
                if (this.branches[i].items.length > 0 ||
                    this.branches[i].hasSplit) return;
            delete this.branches;
            this.hasSplit = false;
            quad = quad.root;
        }
    }

    /**
     * @param {Range} range
     * @param {(item: InsertedQuadItem) => void} callback
     */
    search(range, callback) {
        for (var i = 0, l = this.items.length; i < l; i++)
            if (intersects(range, this.items[i].range))
                callback(this.items[i]);
        if (!this.hasSplit) return;
        var quadrant = this.getQuadrant(range);
        if (quadrant !== -1)
            this.branches[quadrant].search(range, callback);
        else for (i = 0; i < 4; i++)
            if (intersects(this.branches[i].range, range))
                this.branches[i].search(range, callback);
    }

    /**
     * @param {Range} range
     * @param {(item: InsertedQuadItem) => Boolean} selector
     * @returns {Boolean}
     */
    containsAny(range, selector) {
        for (var i = 0, l = this.items.length; i < l; i++)
            if (intersects(range, this.items[i].range))
                if (!selector || selector(this.items[i]))
                    return true;
        if (!this.hasSplit) return false;
        var quadrant = this.getQuadrant(range);
        if (quadrant !== -1)
            return this.branches[quadrant].containsAny(range, selector);
        else for (var i = 0; i < 4; i++)
            if (intersects(this.branches[i].range, range))
                if (this.branches[i].containsAny(range, selector)) return true;
        return false;
    }

    /** @returns {InsertedQuadItem[]} */
    getItems() {
        if (!this.hasSplit) return this.items.slice(0);
        else return this.items.slice(0).concat(this.branches[0].getItems(),
            this.branches[1].getItems(), this.branches[2].getItems(), this.branches[3].getItems());
    }
    /** @returns {Number} */
    getBranchCount() {
        if (this.hasSplit)
            return 1 + this.branches[0].getBranchCount() +
                this.branches[1].getBranchCount() + this.branches[2].getBranchCount() + this.branches[3].getBranchCount();
        return 1;
    }
    debugStr() {
        var str = `items ${this.items.length}/${this.getItems().length} level ${this.level} x ${this.range.x} y ${this.range.y} w ${this.range.w} h ${this.range.h}\n`;
        if (this.hasSplit) {
            str += new Array(1 + this.level * 2).join(" ") + this.branches[0].debugStr();
            str += new Array(1 + this.level * 2).join(" ") + this.branches[1].debugStr();
            str += new Array(1 + this.level * 2).join(" ") + this.branches[2].debugStr();
            str += new Array(1 + this.level * 2).join(" ") + this.branches[3].debugStr();
        }
        return str;
    }

    /**
     * @param {Range} a
     * @returns {-1|0|1|2|3}
     */
    getQuadrant(a) {
        var x = this.range.x,
            y = this.range.y;
        var top = a.y - a.h < y && a.y + a.h < y;
        var bottom = a.y - a.h > y && a.y + a.h > y;
        var left = a.x - a.w < x && a.x + a.w < x;
        var right = a.x - a.w > x && a.x + a.w > x;
        if (top) {
            if (left) return 0;
            if (right) return 1;
        }
        if (bottom) {
            if (left) return 2;
            if (right) return 3;
        }
        return -1;
    }
}

/**
 * @param {Range} a
 * @param {Range} b
 */
function intersects(a, b) {
    return a.x - a.w <= b.x + b.w &&
           a.x + a.w >= b.x - b.w &&
           a.y - a.h <= b.y + b.h &&
           a.y + a.h >= b.y - b.h;
}
/**
 * @param {Range} a
 * @param {Range} b
 */
function fullyIntersects(a, b) {
    return a.x - a.w >= b.x + b.w &&
           a.x + a.w <= b.x - b.w &&
           a.y - a.h >= b.y + b.h &&
           a.y + a.h <= b.y - b.h;
}

module.exports = QuadTree;