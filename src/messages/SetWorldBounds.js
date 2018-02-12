const Writer = require("../primitives/Writer");

/**
 * @param {World} world
 * @param {Boolean} includeServerInfo
 * @param {Number=} protocol
 */
module.exports = (world, includeServerInfo, protocol) => {
    const writer = new Writer();
    writer.writeUInt8(64);
    writer.writeFloat64(world.border.x - world.border.w);
    writer.writeFloat64(world.border.y - world.border.h);
    writer.writeFloat64(world.border.x + world.border.w);
    writer.writeFloat64(world.border.y + world.border.h);
    if (includeServerInfo) {
        writer.writeUInt32(world.handle.gamemode.gamemodeType);
        writer.writeZTString("OgarII 0.9.11", protocol);
    }
    return writer.finalize();
};

const World = require("../worlds/World");