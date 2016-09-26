'use strict';

var AudioTrack = require('./audio-track');
var VideoTrack = require('./video-track');

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
    return [];
};

module.exports = Movie;
