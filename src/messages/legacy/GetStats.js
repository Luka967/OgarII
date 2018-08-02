const Writer = require("../primitives/Writer");

/**
 * @param {WorldStats} stats
 * @param {number} protocol
 */
module.exports = (stats, protocol) => {
    const writer = new Writer();
    writer.writeUInt8(254);
    const legacy = {
        mode: stats.gamemode,
        update: stats.loadTime,
        playersTotal: stats.external,
        playersAlive: stats.playing,
        playersSpect: stats.spectating,
        playersLimit: stats.limit
    };
    writer.writeZTString(JSON.stringify(Object.assign({ }, legacy, stats)), protocol);
    return writer.finalize();
};