'use strict';

const Codec = require('./codec');
const Utils = require('./utils');

function pad(string, char, length) {
    return char.repeat(Math.max(0, length - string.length)) + string;
}

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
        this._pos = 5;
        let spsFlags = this.extraData[this._pos++];
        let spsCount = spsFlags & 0x1f;
        for (let i = 0; i < spsCount; i++) {
            this._units.push(this._readNalUnit());
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
            info += pad(this.extraData[i].toString(16), '0', 2);
        }
        return `avc1.${info}`;
    }

    _readNalUnit() {
        let length = this.extraData.readUInt16BE(this._pos);
        this._pos += 2;
        let unit = this.extraData.slice(this._pos, this._pos + length);
        this._pos += length;
        return unit;
    }

}

module.exports = CodecH264;
