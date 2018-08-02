const Writer = require("../primitives/Writer");
const { version } = require("../primitives/Misc");

/**
 * @param {World} world
 * @param {boolean} includeServerInfo
 * @param {number=} protocol
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
        writer.writeZTString(`OgarII ${version}`, protocol);
    }
    return writer.finalize();
};

const World = require("../worlds/World");