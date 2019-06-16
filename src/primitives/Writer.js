const poolSize = 1048576;
const sharedBuf = Buffer.allocUnsafe(poolSize);
let offset = 0;

class Writer {
    constructor() {
        offset = 0;
    }
    get offset() { return offset; }

    /**
     * @param {number} a
     */
    writeUInt8(a) {
        sharedBuf[offset++] = a;
    }
    /**
     * @param {number} a
     */
    writeInt8(a) {
        sharedBuf[offset++] = a;
    }
    /**
     * @param {number} a
     */
    writeUInt16(a) {
        sharedBuf.writeUInt16LE(a, offset);
        offset += 2;
    }
    /**
     * @param {number} a
     */
    writeInt16(a) {
        sharedBuf.writeUInt16LE(a, offset);
        offset += 2;
    }
    /**
     * @param {number} a
     */
    writeUInt24(a) {
        sharedBuf.writeUIntLE(a, offset, 3);
        offset += 3;
    }
    /**
     * @param {number} a
     */
    writeInt24(a) {
        sharedBuf.writeUIntLE(a, offset, 3);
        offset += 3;
    }
    /**
     * @param {number} a
     */
    writeUInt32(a) {
        sharedBuf.writeUInt32LE(a, offset);
        offset += 4;
    }
    /**
     * @param {number} a
     */
    writeInt32(a) {
        sharedBuf.writeInt32LE(a, offset);
        offset += 4;
    }
    /**
     * @param {number} a
     */
    writeFloat32(a) {
        sharedBuf.writeFloatLE(a, offset);
        offset += 4;
    }
    /**
     * @param {number} a
     */
    writeFloat64(a) {
        sharedBuf.writeDoubleLE(a, offset);
        offset += 8;
    }
    /**
     * @param {string} a
     */
    writeZTStringUCS2(a) {
        if (a) {
            const tbuf = Buffer.from(a, "ucs2");
            offset += tbuf.copy(sharedBuf, offset);
        }
        sharedBuf[offset++] = 0;
        sharedBuf[offset++] = 0;
    }
    /**
     * @param {string} a
     */
    writeZTStringUTF8(a) {
        if (a) {
            const tbuf = Buffer.from(a, "utf-8");
            offset += tbuf.copy(sharedBuf, offset);
        }
        sharedBuf[offset++] = 0;
    }
    /**
     * @param {number} a
     */
    writeColor(a) {
        sharedBuf.writeUIntLE(((a & 0xFF) << 16) | (((a >> 8) & 0xFF) << 8) | (a >> 16), offset, 3);
        offset += 3;
    }
    /**
     * @param {Buffer} a
     */
    writeBytes(a) {
        offset += a.copy(sharedBuf, offset, 0, a.length);
    }
    finalize() {
        const a = Buffer.allocUnsafe(offset);
        sharedBuf.copy(a, 0, 0, offset);
        return a;
    }
}

module.exports = Writer;
