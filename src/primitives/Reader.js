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
        var a = this.data[this.offset++];
        return a < 0x7F ? a : -a + 0x7F;
    }
    readUInt16() {
        var a = this.data.readUInt16LE(this.offset);
        this.offset += 2;
        return a;
    }
    readInt16() {
        var a = this.data.readInt16LE(this.offset);
        this.offset += 2;
        return a;
    }
    readUInt32() {
        var a = this.data.readUInt32LE(this.offset);
        this.offset += 4;
        return a;
    }
    readInt32() {
        var a = this.data.readInt32LE(this.offset);
        this.offset += 4;
        return a;
    }
    readFloat32() {
        var a = this.data.readFloatLE(this.offset);
        this.offset += 4;
        return a;
    }
    readFloat64() {
        var a = this.data.readDoubleLE(this.offset);
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
        var start = this.offset;
        while (this.readUInt16() !== 0) ;
        return this.data.slice(start, this.offset - 2).toString("ucs2");
    }
    readZTStringUTF8() {
        var start = this.offset;
        while (this.readUInt8() !== 0) ;
        return this.data.slice(start, this.offset - 1).toString("utf-8");
    }
}

module.exports = Reader;