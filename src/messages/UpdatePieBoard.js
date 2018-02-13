const Writer = require("../primitives/Writer");

/**
 * @param {Number[]} data
 */
module.exports = (data) => {
    const writer = new Writer();
    writer.writeUInt8(50);
    writer.writeUInt32(data.length);
    for (let i = 0, l = data.length; i < l; i++)
        writer.writeFloat32(data[i]);
    return writer.finalize();
};