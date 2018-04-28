const Writer = require("../primitives/Writer");

/**
 * @type {{[protocol: string]: (writer: Writer, data: String[], protocol: Number) => void}}
*/
const protocols = {
    4: textBoard4,
    5: textBoard4,
    6: textBoard4,
    7: textBoard4,
    8: textBoard4,
    9: textBoard4,
    10: textBoard4,
    11: textBoard4,
    12: textBoard4,
    13: textBoard4,
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
function textBoard4(writer, data, protocol) {
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