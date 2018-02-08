/*global.filterIP = function(ip) {
    if (ip === "::1") return "127.0.0.1";
    var ipv4 = /::FFFF:([0-9]{1,4})\.([0-9]{1,4})\.([0-9]{1,4})\.([0-9]{1,4})/i.exec(ip);
    if (ipv4) return ipv4[1] + "." + ipv4[2] + "." + ipv4[3] + "." + ipv4[4];
    return ip;
};

global.getPlayer = function(id) {
    for (var i in server.worlds)
        for (var j = 0, l = server.worlds[i].players.length; j < l; j++)
            if (server.worlds[i].players[j].id === id) return server.worlds[i].players[j];
    return undefined;
};*/

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
            default: throw new Error("?");
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
    }
};
/*global.blowMass = function(cell) {
    var player = cell.owner;
    var cellsLeft = settings.playerMaxCells - player.ownedCells.length;
    if (cellsLeft <= 0) return [];
    var splits = [];
    var splitMin = settings.playerSplitSize * settings.playerSplitSize / 100;
    var cellMass = cell.getMass();
    if (settings.virusEqualExplosion) {
        var amount = Math.min(~~(cellMass / splitMin), cellsLeft);
        var perPiece = cellMass / (1 + amount);
        for (var i = 0; i < amount; i++)
            splits.push(perPiece);
        return splits;
    }
    if (cellMass / cellsLeft < splitMin) {
        var splitCount = 2;
        var splitMass = cellMass / splitCount;
        while (splitMass > splitMin && splitCount * 2 < cellsLeft)
            splitMass = cellMass / (splitCount *= 2);
        splitMass = cellMass / (splitCount + 1);
        while (splitCount-- > 0) splits.push(splitMass);
        return splits;
    }
    var splitMass = cellMass / 2;
    var massLeft = cellMass / 2;
    while (cellsLeft-- > 0) {
        if (massLeft / cellsLeft < splitMin) {
            splitMass = massLeft / cellsLeft;
            while (cellsLeft-- > 0) splits.push(splitMass);
        }
        while (splitMass >= massLeft && cellsLeft > 0)
            splitMass /= 2;
        splits.push(splitMass);
        massLeft -= splitMass;
    }
    splits.sort(function() { return Math.random() - .5; });
    return splits;
};

global.HSVtoRGB = function(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}*/