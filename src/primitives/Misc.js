const IPv4MappedValidate = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;

module.exports = {
    /**
     * @returns {Color}
     */
    randomColor() {
        switch (~~(Math.random() * 6)) {
            case 0: return { r: ~~(Math.random() * 0x100), g: 0x10, b: 0xFF };
            case 1: return { r: ~~(Math.random() * 0x100), g: 0xFF, b: 0x10 };
            case 2: return { r: 0x10, g: 0xFF, b: ~~(Math.random() * 0x100) };
            case 3: return { r: 0x10, g: ~~(Math.random() * 0x100), b: 0xFF };
            case 4: return { r: 0xFF, g: ~~(Math.random() * 0x100), b: 0x10 };
            case 5: return { r: 0xFF, g: 0x10, b: ~~(Math.random() * 0x100) };
        }
    },
    /**
     * @param {Color=} color
     * @returns {Color}
     */
    grayscaleColor(color) {
        /** @type {number} */
        let weight;
        if (color) weight = ~~(0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
        else weight = 0x7F + ~~(Math.random() * 0x80);
        return { r: weight, g: weight, b: weight };
    },
    /** @param {number[]} n */
    throwIfBadNumber(...n) {
        for (let i = 0; i < n.length; i++)
            if (isNaN(n[i]) || !isFinite(n[i]) || n[i] == null) throw new Error(`bad number (${n[i]}, index ${i})`);
    },

    /**
     * @param {Range} a
     * @param {Range} b
     */
    intersects(a, b) {
        return a.x - a.w <= b.x + b.w &&
            a.x + a.w >= b.x - b.w &&
            a.y - a.h <= b.y + b.h &&
            a.y + a.h >= b.y - b.h;
    },
    /**
     * @param {Range} a
     * @param {Range} b
     */
    fullyIntersects(a, b) {
        return a.x - a.w >= b.x + b.w &&
               a.x + a.w <= b.x - b.w &&
               a.y - a.h >= b.y + b.h &&
               a.y + a.h <= b.y - b.h;
    },
    /**
     * @param {Range} a
     * @param {Range} b
     * @returns {Quadrant}
     */
    getQuadIntersect(a, b) {
        return {
            t: a.y - a.h < b.y || a.y + a.h < b.y,
            b: a.y - a.h > b.y || a.y + a.h > b.y,
            l: a.x - a.w < b.x || a.x + a.w < b.x,
            r: a.x - a.w > b.x || a.x + a.w > b.x
        };
    },
    /**
     * @param {Range} a
     * @param {Range} b
     * @returns {Quadrant}
     */
    getQuadFullIntersect(a, b) {
        return {
            t: a.y - a.h < b.y && a.y + a.h < b.y,
            b: a.y - a.h > b.y && a.y + a.h > b.y,
            l: a.x - a.w < b.x && a.x + a.w < b.x,
            r: a.x - a.w > b.x && a.x + a.w > b.x
        };
    },

    /**
     * @param {string} a
     */
    filterIPAddress(a) {
        const unmapped = IPv4MappedValidate.exec(a);
        return unmapped ? unmapped[1] : a;
    },

    version: "1.2.3"
};
