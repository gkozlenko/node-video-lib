'use strict';

var Track = require('./track');
var AudioSample = require('./audio-sample');
var util = require('util');

function AudioTrack() {
    Track.apply(this, Array.prototype.slice.call(arguments));

    this.channels = null;
    this.sampleRate = null;
    this.sampleSize = null;
}

util.inherits(AudioTrack, Track);

AudioTrack.prototype.createSample = function() {
    return new AudioSample();
};

module.exports = AudioTrack;
