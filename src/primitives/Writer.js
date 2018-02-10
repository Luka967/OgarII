var poolSize = 1048576;
var sharedBuf = Buffer.allocUnsafe(poolSize);
var offset = 0;

class Writer {
    constructor() {
        offset = 0;
    }
    /**
     * @param {Number} a
     */
    writeUInt8(a) {
        sharedBuf[offset++] = a;
    }
    /**
     * @param {Number} a
     */
    writeInt8(a) {
        sharedBuf[offset++] = a;
    }
    /**
     * @param {Number} a
     */
    writeUInt16(a) {
        sharedBuf.writeUInt16LE(a, offset, true);
        offset += 2;
    }
    /**
     * @param {Number} a
     */
    writeInt16(a) {
        sharedBuf.writeUInt16LE(a, offset, true);
        offset += 2;
    }
    /**
     * @param {Number} a
     */
    writeUInt32(a) {
        sharedBuf.writeUInt32LE(a, offset, true);
        offset += 4;
    }
    /**
     * @param {Number} a
     */
    writeInt32(a) {
        sharedBuf.writeInt32LE(a, offset, true);
        offset += 4;
    }
    /**
     * @param {Number} a
     */
    writeFloat32(a) {
        sharedBuf.writeFloatLE(a, offset, true);
        offset += 4;
    }
    /**
     * @param {Number} a
     */
    writeFloat64(a) {
        sharedBuf.writeDoubleLE(a, offset, true);
        offset += 8;
    }
    /**
     * @param {String} a
     */
    writeZTStringUCS2(a) {
        if (a) {
            var tbuf = Buffer.from(a, "ucs2");
            offset += tbuf.copy(sharedBuf, offset);
        }
        sharedBuf[offset++] = 0;
        sharedBuf[offset++] = 0;
    }
    /**
     * @param {String} a
     */
    writeZTStringUTF8(a) {
        if (a) {
            var tbuf = Buffer.from(a, "utf-8");
            offset += tbuf.copy(sharedBuf, offset);
        }
        sharedBuf[offset++] = 0;
    }
    /**
     * @param {String} a
     * @param {Number} protocol
     */
    writeZTString(a, protocol) {
        this[protocol < 6 ? "writeZTStringUCS2" : "writeZTStringUTF8"](a);
    }
    /**
     * @param {Buffer} a
     */
    writeBytes(a) {
        offset += a.copy(sharedBuf, offset, 0, a.length);
    }
    finalize() {
        var a = Buffer.allocUnsafe(offset);
        sharedBuf.copy(a, 0, 0, offset);
        return a;
    }
}

module.exports = Writer;