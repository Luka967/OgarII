class Reader {
    /**
     * @param {Buffer} data
     * @param {Number=} offset
     */
    constructor(data, offset) {
        this.data = data;
        this.offset = offset || 0;
        this.dataLength = data.length;
    }
    readUInt8() {
        return this.data[this.offset++];
    }
    readInt8() {
        const a = this.data[this.offset++];
        return a < 0x7F ? a : -a + 0x7F;
    }
    readUInt16() {
        const a = this.data.readUInt16LE(this.offset);
        this.offset += 2;
        return a;
    }
    readInt16() {
        const a = this.data.readInt16LE(this.offset);
        this.offset += 2;
        return a;
    }
    readUInt32() {
        const a = this.data.readUInt32LE(this.offset);
        this.offset += 4;
        return a;
    }
    readInt32() {
        const a = this.data.readInt32LE(this.offset);
        this.offset += 4;
        return a;
    }
    readFloat32() {
        const a = this.data.readFloatLE(this.offset);
        this.offset += 4;
        return a;
    }
    readFloat64() {
        const a = this.data.readDoubleLE(this.offset);
        this.offset += 8;
        return a;
    }
    /**
     * @param {Number} count
     */
    skip(count) {
        this.offset += count;
    }
    readZTStringUCS2() {
        let start = this.offset, index = this.offset;
        while (index + 2 < this.dataLength && this.readUInt16() !== 0) index += 2;
        return this.data.slice(start, index).toString("ucs2");
    }
    readZTStringUTF8() {
        let start = this.offset, index = this.offset;
        while (index + 1 < this.dataLength && this.readUInt8() !== 0) index++;
        return this.data.slice(start, index).toString("utf-8");
    }
    /**
     * @param {Number} protocol
     */
    readZTString(protocol) {
        return this[protocol < 6 ? "readZTStringUCS2" : "readZTStringUTF8"]();
    }
}

module.exports = Reader;