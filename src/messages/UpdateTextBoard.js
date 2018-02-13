const Writer = require("../primitives/Writer");

/**
 * @type {{[protocol: string]: (writer: Writer, data: String[], protocol: Number) => void}}
*/
const protocols = {
    4: textBoard46,
    5: textBoard46,
    6: textBoard46,
    7: textBoard46,
    8: textBoard46,
    9: textBoard46,
    10: textBoard46,
    11: textBoard46,
    12: textBoard46,
    13: textBoard46,
    14: textBoard14,
    15: textBoard14,
    16: textBoard14,
    17: textBoard14
};

/**
 * @param {String[]} data
 * @param {Number} protocol
 */
module.exports = (data, protocol) => {
    const writer = new Writer();
    protocols[protocol](writer, data, protocol);
    return writer.finalize();
};

/**
 * @param {Writer} writer
 * @param {String[]} data
 * @param {Number} protocol
 */
function textBoard46(writer, data, protocol) {
    writer.writeUInt8(48);
    writer.writeUInt32(data.length);
    for (let i = 0, l = data.length; i < l; i++)
        writer.writeZTString(data[i], protocol);
}

/**
 * @param {Writer} writer
 * @param {String[]} data
 * @param {Number} protocol
 */
function textBoard14(writer, data, protocol) {
    writer.writeUInt8(53);
    for (let i = 0, l = data.length; i < l; i++) {
        writer.writeUInt8(2);
        writer.writeZTStringUTF8(data[i]);
    }
}