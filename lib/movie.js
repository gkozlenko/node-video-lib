'use strict';

var AudioTrack = require('./audio-track');
var VideoTrack = require('./video-track');

function compareSamples(sample1, sample2) {
    var timestamp1 = Math.round(1000 * sample1.timestamp());
    var timestamp2 = Math.round(1000 * sample2.timestamp());
    var timestampDelta = timestamp1 - timestamp2;
    if (timestampDelta == 0) {
        return sample1.offset() - sample2.offset();
    } else {
        return timestampDelta;
    }
}

function Movie() {
    this._timescale = null;
    this._duration = null;
    this._tracks = [];
}

Movie.prototype.timescale = function(value) {
    if (value === undefined) {
        return this._timescale;
    }
    this._timescale = value;
};

Movie.prototype.duration = function(value) {
    if (value === undefined) {
        return this._duration;
    }
    this._duration = value;
};

Movie.prototype.effectiveDuration = function() {
    if (this._timescale) {
        return this._duration / this._timescale;
    }
    return this._duration || 0;
};

Movie.prototype.tracks = function(value) {
    if (value === undefined) {
        return this._tracks;
    }
    this._tracks = value;
};

Movie.prototype.addTrack = function(track) {
    this._tracks.push(track);
};

Movie.prototype.videoTrack = function() {
    for (var i = 0, l = this._tracks.length; i < l; i++) {
        if (this._tracks[i] instanceof VideoTrack) {
            return this._tracks[i];
        }
    }
    return null;
};

Movie.prototype.audioTrack = function() {
    for (var i = 0, l = this._tracks.length; i < l; i++) {
        if (this._tracks[i] instanceof AudioTrack) {
            return this._tracks[i];
        }
    }
    return null;
};

Movie.prototype.samples = function() {
    var samples = [];
    var videoTrack = this.videoTrack();
    if (videoTrack !== null) {
        samples = samples.concat(videoTrack.samples());
    }
    var audioTrack = this.audioTrack();
    if (audioTrack !== null) {
        samples = samples.concat(audioTrack.samples());
    }
    return samples.sort(compareSamples);
};

module.exports = Movie;
