'use strict';

const Codec = require('./codec');
const Utils = require('./utils');

const TYPE_VPS = 32;
const TYPE_SPS = 33;
const TYPE_PPS = 34;

class CodecH265 extends Codec {

    type() {
        return Utils.CODEC_H265;
    }

    constructor(extraData) {
        super();

        this.extraData = extraData;
        this._units = [];
        this._pos = 0;
    }

    parse() {
        this._pos = 22;
        let nalSequences = this.extraData[this._pos++];
        for (let i = 0; i < nalSequences; i++) {
            let nalType =  this.extraData[this._pos++] & 0x3f;
            let count = this.extraData.readUInt16BE(this._pos); this._pos += 2;
            for (let j = 0; j < count; j++) {
                let nalUnit = this._readNalUnit();
                if (nalType === TYPE_VPS || nalType === TYPE_SPS || nalType === TYPE_PPS) {
                    this._units.push(nalUnit);
                }
            }
        }
    }

    units() {
        return this._units;
    }

    codec() {
        let profileIndication = this.extraData[1];
        let generalTierFlag = ((profileIndication >> 5) & 1) === 1;
        let generalCompatibilityFlags = this.extraData.readUInt32LE(2).toString(16).replace(/0+$/, '');
        let generalLevel = this.extraData[12];
        let generalConstraintFlags = [];
        for (let i = 6; i < 12; i++) {
            generalConstraintFlags.push(this.extraData[i]);
        }
        let size = 0;
        for (let i = generalConstraintFlags.length - 1; i > 0; i--) {
            if (generalConstraintFlags[i] > 0) {
                size = i;
                break;
            }
        }

        let fields = [
            'hvc1',
            (profileIndication >> 6) + (profileIndication & 0x1f),
            generalCompatibilityFlags,
            `${generalTierFlag ? 'H' : 'L'}${generalLevel}`,
        ];
        for (let i = 0; i <= size; i++) {
            fields.push(generalConstraintFlags[i].toString(16).replace(/0+$/, ''));
        }
        return fields.join('.');
    }

    _readNalUnit() {
        let length = this.extraData.readUInt16BE(this._pos);
        this._pos += 2;
        let unit = this.extraData.slice(this._pos, this._pos + length);
        this._pos += length;
        return unit;
    }

}

module.exports = CodecH265;
