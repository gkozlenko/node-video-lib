'use strict';

var Sample = require('./sample');

function Track() {
    this._timescale = null;
    this._duration = null;
    this._extraData = null;
    this._samples = [];
}

Track.prototype.timescale = function(value) {
    if (value === undefined) {
        return this._timescale;
    }
    this._timescale = value;
};

Track.prototype.duration = function(value) {
    if (value === undefined) {
        return this._duration;
    }
    this._duration = value;
};

Track.prototype.effectiveDuration = function() {
    if (this._timescale) {
        return this._duration / this._timescale;
    }
    return this._duration || 0;
};

Track.prototype.extraData = function(value) {
    if (value === undefined) {
        return this._extraData;
    }
    this._extraData = value;
};

Track.prototype.samples = function(value) {
    if (value === undefined) {
        return this._samples;
    }
    this._samples = value;
};

Track.prototype.addSample = function(sample) {
    this._samples.push(sample);
};

Track.prototype.createSample = function() {
    return new Sample();
};

module.exports = Track;
