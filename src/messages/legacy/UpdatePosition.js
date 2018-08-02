const Writer = require("../primitives/Writer");

/**
 * @param {ViewArea} viewArea 
 */
module.exports = (viewArea) => {
    const writer = new Writer();
    writer.writeUInt8(17);
    writer.writeFloat32(viewArea.x);
    writer.writeFloat32(viewArea.y);
    writer.writeFloat32(viewArea.s);
    return writer.finalize();
};