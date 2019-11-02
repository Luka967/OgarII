const IPv4MappedValidate = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;

module.exports = {
    randomColor() {
        switch (~~(Math.random() * 6)) {
            case 0: return (~~(Math.random() * 0x100) << 16) | (0xFF << 8) | 0x10;
            case 1: return (~~(Math.random() * 0x100) << 16) | (0x10 << 8) | 0xFF;
            case 2: return (0xFF << 16) | (~~(Math.random() * 0x100) << 8) | 0x10;
            case 3: return (0x10 << 16) | (~~(Math.random() * 0x100) << 8) | 0xFF;
            case 4: return (0x10 << 16) | (0xFF << 8) | ~~(Math.random() * 0x100);
            case 5: return (0xFF << 16) | (0x10 << 8) | ~~(Math.random() * 0x100);
        }
    },
    /**
     * @param {number=} color
     */
    grayscaleColor(color) {
        /** @type {number} */
        let weight;
        if (color) weight = ~~(0.299 * (color & 0xFF) + 0.587 * ((color.g >> 8) & 0xFF) + 0.114 * (color.b >> 16));
        else weight = 0x7F + ~~(Math.random() * 0x80);
        return (weight << 16) | (weight << 8) | weight;
    },
    /** @param {number[]} n */
    throwIfBadNumber(...n) {
        for (let i = 0; i < n.length; i++)
            if (isNaN(n[i]) || !isFinite(n[i]) || n[i] == null)
                throw new Error(`bad number (${n[i]}, index ${i})`);
    },
    /** @param {number[]} n */
    throwIfBadOrNegativeNumber(...n) {
        for (let i = 0; i < n.length; i++)
            if (isNaN(n[i]) || !isFinite(n[i]) || n[i] == null || n[i] < 0)
                throw new Error(`bad or negative number (${n[i]}, index ${i})`);
    },

    /**
     * @param {Rect} a
     * @param {Rect} b
     */
    intersects(a, b) {
        return a.x - a.w <= b.x + b.w &&
            a.x + a.w >= b.x - b.w &&
            a.y - a.h <= b.y + b.h &&
            a.y + a.h >= b.y - b.h;
    },
    /**
     * @param {Rect} a
     * @param {Rect} b
     */
    fullyIntersects(a, b) {
        return a.x - a.w >= b.x + b.w &&
               a.x + a.w <= b.x - b.w &&
               a.y - a.h >= b.y + b.h &&
               a.y + a.h <= b.y - b.h;
    },
    /**
     * @param {Rect} a
     * @param {Rect} b
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
     * @param {Rect} a
     * @param {Rect} b
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

    version: "1.3.6"
};
