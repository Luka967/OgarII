const Writer = require("../primitives/Writer");

/**
 * @param {{limit: Number, internal: Number, external: Number, playing: Number, spectating: Number, name: String, gamemode: String, loadTime: Number, uptime: Number}} stats
 * @param {Number} protocol
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