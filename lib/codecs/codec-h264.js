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

        let pos = 5;
        const units = [];

        const readNalUnit = () => {
            if (pos + 2 > this.extraData.length) {
                throw new Error('Invalid H.264 config: incomplete NAL unit length');
            }

            const length = this.extraData.readUInt16BE(pos);
            pos += 2;

            if (pos + length > this.extraData.length) {
                throw new Error(`Invalid H.264 config: incomplete NAL unit data (expected ${length}, got ${this.extraData.length - pos})`);
            }

            const unit = this.extraData.subarray(pos, pos + length);
            pos += length;
            return unit;
        };

        const spsFlags = this.extraData[pos++];
        const spsCount = spsFlags & 0x1f;
        for (let i = 0; i < spsCount; i++) {
            units.push(readNalUnit());
        }

        if (pos < this.extraData.length) {
            const ppsCount = this.extraData[pos++];
            for (let i = 0; i < ppsCount; i++) {
                units.push(readNalUnit());
            }
        }

        this._units = units;
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

}

module.exports = CodecH264;
