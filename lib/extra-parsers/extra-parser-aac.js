'use strict';

var ExtraParser = require('./extra-parser');
var util = require('util');

var DEFAULT_SAMPLE_COUNT = 1024;
var DEFAULT_BITS_PER_SAMPLE = 16;

var AAC_SAMPLE_RATES = [
    96000, 88200, 64000, 48000, 44100, 32000, 24000,
    22050, 16000, 12000, 11025, 8000, 7350
];

var AAC_CHANNELS = [0, 1, 2, 3, 4, 5, 6, 8];

function ExtraParserAac() {
    this._rateIndex = null;
    this._sampleRate = null;
    this._channelsIndex = null;
    this._channels = null;
    this._profileObjectType = null;

    ExtraParser.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(ExtraParserAac, ExtraParser);

ExtraParserAac.prototype._parse = function() {
    var flags1 = this._extraData[0];
    var flags2 = this._extraData[1];
    this._profileObjectType = (flags1 & 0xf8) >> 3;
    this._rateIndex = ((flags1 & 7) << 1) + ((flags2 & 0x80) >> 7 & 1);
    if (this._rateIndex > 0 && this._rateIndex < AAC_SAMPLE_RATES.length) {
        this._sampleRate = AAC_SAMPLE_RATES[this._rateIndex];
    }
    this._channelsIndex = (flags2 & 0x7f) >> 3;
    if (this._channelsIndex > 0 && this._channelsIndex < AAC_CHANNELS.length) {
        this._channels = AAC_CHANNELS[this._channelsIndex];
    }
};

ExtraParserAac.prototype.rateIndex = function() {
    return this._rateIndex;
};

ExtraParserAac.prototype.channelsIndex = function() {
    return this._channelsIndex;
};

ExtraParserAac.prototype.channels = function() {
    return this._channels;
};

ExtraParserAac.prototype.profileObjectType = function() {
    return this._profileObjectType;
};

ExtraParserAac.prototype.sampleCount = function() {
    return DEFAULT_SAMPLE_COUNT;
};

ExtraParserAac.prototype.sampleRate = function() {
    return this._sampleRate;
};

ExtraParserAac.prototype.bitsPerSample = function() {
    return DEFAULT_BITS_PER_SAMPLE;
};

ExtraParserAac.prototype.packetSize = function() {
    return this._channels << 1;
};

module.exports = ExtraParserAac;
