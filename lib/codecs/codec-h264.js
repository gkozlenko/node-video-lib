'use strict';

const Codec = require('./codec');
const Utils = require('./utils');

class CodecH264 extends Codec {

    type() {
        return Utils.CODEC_H264;
    }

    constructor(extraData) {
        super();

        this.extraData = extraData;
        this._units = [];
        this._pos = 0;
    }

    parse() {
        if (!this.extraData || this.extraData.length < 7) {
            throw new Error(`Invalid H.264 config: data too short (${this.extraData ? this.extraData.length : 0} bytes)`);
        }

        if (this.extraData[0] !== 1) {
            throw new Error(`Invalid H.264 config version: ${this.extraData[0]}`);
        }

        const nalLengthSize = (this.extraData[4] & 0x03) + 1;
        if (nalLengthSize !== 4) {
            throw new Error(`Unsupported H.264 NAL unit length size: ${nalLengthSize} (only 4 bytes supported)`);
        }

        this._pos = 5;
        let spsFlags = this.extraData[this._pos++];
        let spsCount = spsFlags & 0x1f;
        for (let i = 0; i < spsCount; i++) {
            this._units.push(this._readNalUnit());
        }

        if (this._pos >= this.extraData.length) {
            return;
        }

        let ppsCount = this.extraData[this._pos++];
        for (let i = 0; i < ppsCount; i++) {
            this._units.push(this._readNalUnit());
        }
    }

    units() {
        return this._units;
    }

    codec() {
        let info = '';
        for (let i = 1; i < 4; i++) {
            info += this.extraData[i].toString(16).padStart(2, '0');
        }
        return `avc1.${info}`;
    }

    _readNalUnit() {
        if (this._pos + 2 > this.extraData.length) {
            throw new Error('Invalid H.264 config: incomplete NAL unit length');
        }

        let length = this.extraData.readUInt16BE(this._pos);
        this._pos += 2;

        if (this._pos + length > this.extraData.length) {
            throw new Error(`Invalid H.264 config: incomplete NAL unit data (expected ${length}, got ${this.extraData.length - this._pos})`);
        }

        let unit = this.extraData.subarray(this._pos, this._pos + length);
        this._pos += length;
        return unit;
    }

}

module.exports = CodecH264;
