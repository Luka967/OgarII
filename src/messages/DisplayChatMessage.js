const Writer = require("../primitives/Writer");

/**
 * @param {{name: String, isServer: Boolean, color: {r: Number, g: Number, b: Number}}} source
 * @param {String} message
 * @param {Number} protocol
 */
module.exports = (source, message, protocol) => {
    const writer = new Writer();
    writer.writeUInt8(99);
    writer.writeUInt8(source.isServer * 128);
    writer.writeUInt8(source.color.r);
    writer.writeUInt8(source.color.g);
    writer.writeUInt8(source.color.b);
    writer.writeZTString(source.name, protocol);
    writer.writeZTString(message, protocol);
    return writer.finalize();
};