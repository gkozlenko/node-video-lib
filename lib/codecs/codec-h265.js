'use strict';

const Codec = require('./codec');
const Utils = require('./utils');

const TYPE_VPS = 32;
const TYPE_SPS = 33;
const TYPE_PPS = 34;

const PROFILE_PREFIXES = ['', 'A', 'B', 'C'];

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
        let profileIdc = profileIndication & 0x1f;
        let profileSpace = (profileIndication >> 6);
        let generalTierFlag = ((profileIndication >> 5) & 1) === 1;
        let generalCompatibilityFlags = this.extraData.readUInt32BE(2).toString(16);
        let generalLevel = this.extraData[12];

        let profilePrefix =  PROFILE_PREFIXES[profileSpace];

        let fields = [
            'hvc1',
            `${profilePrefix}${profileIdc}`,
            generalCompatibilityFlags,
            `${generalTierFlag ? 'H' : 'L'}${generalLevel}`,
        ];

        let generalConstraintFlags = [];
        let generalConstraintFlagsLength = 0;
        for (let i = 0; i < 6; i++) {
            let val = this.extraData[i + 6];
            generalConstraintFlags.push(val);
            if (val > 0) {
                generalConstraintFlagsLength = i + 1;
            }
        }
        for (let i = 0; i < generalConstraintFlagsLength; i++) {
            fields.push(generalConstraintFlags[i].toString(16).replace(/0+$/, ''));
        }

        return fields.join('.');
    }

    _readNalUnit() {
        let length = this.extraData.readUInt16BE(this._pos);
        this._pos += 2;
        let unit = this.extraData.subarray(this._pos, this._pos + length);
        this._pos += length;
        return unit;
    }

}

module.exports = CodecH265;
