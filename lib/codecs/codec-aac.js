'use strict';

const Codec = require('./codec');
const Utils = require('./utils');

const AAC_SAMPLE_RATES = [
    96000, 88200, 64000, 48000, 44100, 32000, 24000,
    22050, 16000, 12000, 11025, 8000, 7350,
];

const AAC_CHANNELS = [0, 1, 2, 3, 4, 5, 6, 8];

class CodecAac extends Codec {

    type() {
        return Utils.CODEC_AAC;
    }

    constructor(extraData) {
        super();

        this.extraData = extraData;
        this.rateIndex = null;
        this.sampleRate = null;
        this.channelsIndex = null;
        this.channels = null;
        this.profileObjectType = null;
    }

    parse() {
        let flags1 = this.extraData[0];
        let flags2 = this.extraData[1];
        this.profileObjectType = (flags1 & 0xf8) >> 3;
        this.rateIndex = ((flags1 & 7) << 1) + ((flags2 & 0x80) >> 7 & 1);
        this.sampleRate = AAC_SAMPLE_RATES[this.rateIndex] || null;
        this.channelsIndex = (flags2 & 0x7f) >> 3;
        this.channels = AAC_CHANNELS[this.channelsIndex] || null;
    }

    codec() {
        return `mp4a.40.${this.profileObjectType}`;
    }

}

module.exports = CodecAac;
