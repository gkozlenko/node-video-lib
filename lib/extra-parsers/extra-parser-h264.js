'use strict';

const ExtraParser = require('./extra-parser');

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
