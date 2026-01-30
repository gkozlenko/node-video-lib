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
    }

    parse() {
        if (!this.extraData || this.extraData.length < 23) {
            throw new Error(`Invalid H.265 config: data too short (${this.extraData ? this.extraData.length : 0} bytes)`);
        }

        if (this.extraData[0] !== 1) {
            throw new Error(`Invalid H.265 config version: ${this.extraData[0]}`);
        }

        const nalLengthSize = (this.extraData[21] & 0x03) + 1;
        if (nalLengthSize !== 4) {
            throw new Error(`Unsupported H.265 NAL unit length size: ${nalLengthSize} (only 4 bytes supported)`);
        }

        let pos = 22;
        const nalSequences = this.extraData[pos++];
        const units = [];

        const readNalUnit = () => {
            if (pos + 2 > this.extraData.length) {
                throw new Error('Invalid H.265 config: incomplete NAL unit length');
            }

            const length = this.extraData.readUInt16BE(pos);
            pos += 2;

            if (pos + length > this.extraData.length) {
                throw new Error(`Invalid H.265 config: incomplete NAL unit data (expected ${length}, got ${this.extraData.length - pos})`);
            }

            const unit = this.extraData.subarray(pos, pos + length);
            pos += length;
            return unit;
        };

        for (let i = 0; i < nalSequences; i++) {
            if (pos + 3 > this.extraData.length) {
                throw new Error('Invalid H.265 config: incomplete NAL array header');
            }

            const nalType = this.extraData[pos++] & 0x3f;
            const count = this.extraData.readUInt16BE(pos);
            pos += 2;

            for (let j = 0; j < count; j++) {
                const nalUnit = readNalUnit();
                if (nalType === TYPE_VPS || nalType === TYPE_SPS || nalType === TYPE_PPS) {
                    units.push(nalUnit);
                }
            }
        }

        this._units = units;
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

}

module.exports = CodecH265;
