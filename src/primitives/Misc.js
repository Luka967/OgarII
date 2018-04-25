const fs = require("fs");
const http = require("http");

/**
 * @typedef {{x: Number, y: Number, w: Number, h: Number}} Range
 */

module.exports = {
    /**
     * @returns {{r: Number, g: Number, b: Number}}
     */
    randomColor() {
        var colors = [~~(Math.random() * 0x100), 0x10, 0xFF];
        switch (~~(Math.random() * 6)) {
            case 0: return { r: colors[0], g: colors[1], b: colors[2] };
            case 1: return { r: colors[0], g: colors[2], b: colors[1] };
            case 2: return { r: colors[1], g: colors[2], b: colors[0] };
            case 3: return { r: colors[1], g: colors[0], b: colors[2] };
            case 4: return { r: colors[2], g: colors[0], b: colors[1] };
            case 5: return { r: colors[2], g: colors[1], b: colors[0] };
        }
    },
    /**
     * @param {{r: Number, g: Number, b: Number}=} color
     * @returns {{r: Number, g: Number, b: Number}}
     */
    grayscaleColor(color) {
        /** @type {Number} */
        var weight;
        if (color) weight = ~~(0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
        else weight = 0x7F + ~~(Math.random() * 0x80);
        return { r: weight, g: weight, b: weight };
    },
    /** @param {Number[]} n */
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

    version: "1.0.0"
};