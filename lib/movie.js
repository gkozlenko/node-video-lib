'use strict';

var AudioTrack = require('./audio-track');
var VideoTrack = require('./video-track');

function compareSamples(sample1, sample2) {
    var timestamp1 = Math.round(1000 * sample1.timestamp());
    var timestamp2 = Math.round(1000 * sample2.timestamp());
    var timestampDelta = timestamp1 - timestamp2;
    if (timestampDelta == 0) {
        return sample1.offset - sample2.offset;
    } else {
        return timestampDelta;
    }
}

function Movie() {
    this.timescale = null;
    this.duration = null;
    this.tracks = [];
}

Movie.prototype.addTrack = function(track) {
    this.tracks.push(track);
};

Movie.prototype.videoTrack = function() {
    for (var i = 0, l = this.tracks.length; i < l; i++) {
        if (this.tracks[i] instanceof VideoTrack) {
            return this.tracks[i];
        }
    }
    return null;
};

Movie.prototype.audioTrack = function() {
    for (var i = 0, l = this.tracks.length; i < l; i++) {
        if (this.tracks[i] instanceof AudioTrack) {
            return this.tracks[i];
        }
    }
    return null;
};

Movie.prototype.samples = function() {
    var samples = [];
    var videoTrack = this.videoTrack();
    if (videoTrack !== null) {
        samples = samples.concat(videoTrack.samples);
    }
    var audioTrack = this.audioTrack();
    if (audioTrack !== null) {
        samples = samples.concat(audioTrack.samples);
    }
    return samples.sort(compareSamples);
};

module.exports = Movie;
