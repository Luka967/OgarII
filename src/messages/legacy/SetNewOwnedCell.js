const Writer = require("../primitives/Writer");

/**
 * @param {number} id
 */
module.exports = (id) => {
    const writer = new Writer();
    writer.writeUInt8(32);
    writer.writeUInt32(id);
    return writer.finalize();
};