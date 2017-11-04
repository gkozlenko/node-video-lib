'use strict';

const ExtraParser = require('./extra-parser');

function pad(string, char, length) {
    return char.repeat(Math.max(0, length - string.length)) + string;
}

class ExtraParserH264 extends ExtraParser {

    static parse(extraData) {
        let parser = new ExtraParserH264(extraData);
        parser.parse();
        return parser;
    }

    constructor(extraData) {
        super(extraData);

        this.sps = [];
        this.pps = [];
        this._pos = 0;
    }

    parse() {
        this._pos = 5;
        let spsFlags = this.extraData[this._pos++];
        let spsCount = spsFlags & 0x1f;
        for (let i = 0; i < spsCount; i++) {
            this.sps.push(this._readNalUnit());
        }
        let ppsCount = this.extraData[this._pos++];
        for (let i = 0; i < ppsCount; i++) {
            this.pps.push(this._readNalUnit());
        }
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
        let unit = new Buffer(length);
        this.extraData.copy(unit, 0, this._pos, this._pos + length);
        this._pos += length;
        return unit;
    }

}

module.exports = ExtraParserH264;
