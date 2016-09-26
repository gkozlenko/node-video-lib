'use strict';

var Track = require('./track');
var util = require('util');

function AudioTrack() {
    Track.apply(this, Array.prototype.slice.call(arguments));

    this.channels = null;
    this.sampleRate = null;
    this.sampleSize = null;
}

util.inherits(AudioTrack, Track);

AudioTrack.prototype.createSample = function() {
    //
};

module.exports = AudioTrack;
