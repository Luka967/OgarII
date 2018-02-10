const Writer = require("../primitives/Writer");

module.exports = (id) => {
    const writer = new Writer();
    writer.writeUInt8(32);
    writer.writeUInt32(id);
    return writer.finalize();
};