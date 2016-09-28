'use strict';

var Track = require('./track');
var AudioSample = require('./audio-sample');
var util = require('util');

function AudioTrack() {
    Track.apply(this, Array.prototype.slice.call(arguments));

    this._channels = null;
    this._sampleRate = null;
    this._sampleSize = null;
}

util.inherits(AudioTrack, Track);

AudioTrack.prototype.channels = function(value) {
    if (value === undefined) {
        return this._channels;
    }
    this._channels = value;
};

AudioTrack.prototype.sampleRate = function(value) {
    if (value === undefined) {
        return this._sampleRate;
    }
    this._sampleRate = value;
};

AudioTrack.prototype.sampleSize = function(value) {
    if (value === undefined) {
        return this._sampleSize;
    }
    this._sampleSize = value;
};

AudioTrack.prototype.createSample = function() {
    return new AudioSample();
};

module.exports = AudioTrack;
