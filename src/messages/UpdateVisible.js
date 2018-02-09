const Connection = require("../sockets/Connection");
const Writer = require("../primitives/Writer");
const Cell = require("../cells/Cell");

/**
 * @param {Connection} requesting
 * @param {Cell[]} add
 * @param {Cell[]} upd
 * @param {Cell[]} eat
 * @param {Cell[]} del
 * @returns {Buffer}
 */
module.exports = (requesting, add, upd, eat, del) => {
    const writer = new Writer();
    writer.writeUInt8(16);
};