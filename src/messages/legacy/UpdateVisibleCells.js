const Writer = require("../primitives/Writer");

/**
 * @typedef {(writer: Writer, protocol: number, cell: Cell, includeType: boolean, includeSize: boolean, includePos: boolean, includeColor: boolean, includeName: boolean, includeSkin: boolean) => void} writeCellData
 */

/** @type {{[protocol: string]: writeCellData}} */
const protocols = {
    4: writeCellData4,
    5: writeCellData4,
    6: writeCellData6,
    7: writeCellData6,
    8: writeCellData6,
    9: writeCellData6,
    10: writeCellData6,
    11: writeCellData11,
    12: writeCellData11,
    13: writeCellData11,
    14: writeCellData11,
    15: writeCellData11,
    16: writeCellData11,
    17: writeCellData11
};

/**
 * @param {Connection} requesting
 * @param {Cell[]} add
 * @param {Cell[]} upd
 * @param {Cell[]} eat
 * @param {Cell[]} del
 */
module.exports = (requesting, add, upd, eat, del) => {
    const writer = new Writer();
    const protocol = requesting.protocol;
    writer.writeUInt8(16);
    let i, l, cell;

    l = eat.length;
    writer.writeUInt16(l);
    for (i = 0; i < l; i++) {
        cell = eat[i];
        writer.writeUInt32(cell.eatenBy.id);
        writer.writeUInt32(cell.id);
    }

    for (i = 0, l = add.length; i < l; i++) {
        cell = add[i];
        protocols[requesting.protocol](writer, protocol, cell, true, true, true, true, true, true);
    }
    for (i = 0, l = upd.length; i < l; i++) {
        cell = upd[i];
        protocols[requesting.protocol](writer, protocol, cell, false, cell.sizeChanged, cell.posChanged, cell.colorChanged, cell.nameChanged, cell.skinChanged);
    }
    writer.writeUInt32(0);

    l = del.length;
    writer[protocol < 6 ? "writeUInt32" : "writeUInt16"](l);
    for (i = 0; i < l; i++) writer.writeUInt32(del[i].id);
    return writer.finalize();
};

/**
 * @param {Writer} writer
 * @param {Cell} cell
 * @param {boolean} includeType
 * @param {boolean} includeSize
 * @param {boolean} includePos
 * @param {boolean} includeColor
 * @param {boolean} includeName
 * @param {boolean} includeSkin
 */
function writeCellData4(writer, protocol, cell, includeType, includeSize, includePos, includeColor, includeName, includeSkin) {
    writer.writeUInt32(cell.id);
    writer[protocol === 4 ? "writeUInt16" : "writeUInt32"](cell.x);
    writer[protocol === 4 ? "writeUInt16" : "writeUInt32"](cell.y);
    writer.writeUInt16(cell.size);
    writer.writeUInt8(cell.color.r);
    writer.writeUInt8(cell.color.g);
    writer.writeUInt8(cell.color.b);

    let flags = 0;
    if (cell.isSpiked) flags |= 0x01;
    if (includeSkin) flags |= 0x04;
    if (cell.isAgitated) flags |= 0x10;
    if (cell.type === 3) flags |= 0x20;
    writer.writeUInt8(flags);

    if (includeSkin) writer.writeZTStringUTF8(cell.skin);
    if (includeName) writer.writeZTStringUCS2(cell.name);
    else writer.writeUInt16(0);
}

/**
 * @param {Writer} writer
 * @param {Cell} cell
 * @param {boolean} includeType
 * @param {boolean} includeSize
 * @param {boolean} includePos
 * @param {boolean} includeColor
 * @param {boolean} includeName
 * @param {boolean} includeSkin
 */
function writeCellData6(writer, protocol, cell, includeType, includeSize, includePos, includeColor, includeName, includeSkin) {
    writer.writeUInt32(cell.id);
    writer.writeUInt32(cell.x);
    writer.writeUInt32(cell.y);
    writer.writeUInt16(cell.size);

    let flags = 0;
    if (cell.isSpiked) flags |= 0x01;
    if (includeColor) flags |= 0x02;
    if (includeSkin) flags |= 0x04;
    if (includeName) flags |= 0x08;
    if (cell.isAgitated) flags |= 0x10;
    if (cell.type === 3) flags |= 0x20;
    writer.writeUInt8(flags);

    if (includeColor) {
        writer.writeUInt8(cell.color.r);
        writer.writeUInt8(cell.color.g);
        writer.writeUInt8(cell.color.b);
    }
    if (includeSkin) writer.writeZTStringUTF8(cell.skin);
    if (includeName) writer.writeZTStringUTF8(cell.name);
}

/**
 * @param {Writer} writer
 * @param {Cell} cell
 * @param {boolean} includeType
 * @param {boolean} includeSize
 * @param {boolean} includePos
 * @param {boolean} includeColor
 * @param {boolean} includeName
 * @param {boolean} includeSkin
 */
function writeCellData11(writer, protocol, cell, includeType, includeSize, includePos, includeColor, includeName, includeSkin) {
    writer.writeUInt32(cell.id);
    writer.writeUInt32(cell.x);
    writer.writeUInt32(cell.y);
    writer.writeUInt16(cell.size);

    let flags = 0;
    if (cell.isSpiked) flags |= 0x01;
    if (includeColor) flags |= 0x02;
    if (includeSkin) flags |= 0x04;
    if (includeName) flags |= 0x08;
    if (cell.isAgitated) flags |= 0x10;
    if (cell.type === 3) flags |= 0x20;
    if (includeType && cell.type === 1) flags |= 0x80;
    writer.writeUInt8(flags);

    if (includeType && cell.type === 1) writer.writeUInt8(cell.type);
    if (includeColor) {
        writer.writeUInt8(cell.color.r);
        writer.writeUInt8(cell.color.g);
        writer.writeUInt8(cell.color.b);
    }
    if (includeSkin) writer.writeZTStringUTF8(cell.skin);
    if (includeName) writer.writeZTStringUTF8(cell.name);
}

const Connection = require("../sockets/Connection");
const Cell = require("../cells/Cell");