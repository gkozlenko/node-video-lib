'use strict';

var util = require('util');

var Track = require('./track');
var AudioSample = require('./audio-sample');
var MediaUtil = require('./media-util');

function AudioTrack() {
    Track.apply(this, Array.prototype.slice.call(arguments));

    this._channels = null;
    this._sampleRate = null;
    this._sampleSize = null;
}

util.inherits(AudioTrack, Track);
MediaUtil.generateMethods(AudioTrack.prototype, ['channels', 'sampleRate', 'sampleSize']);

AudioTrack.prototype.createSample = function() {
    return new AudioSample();
};

module.exports = AudioTrack;
