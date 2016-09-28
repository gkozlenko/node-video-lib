'use strict';

function Fragment() {
    this._timescale = null;
    this._timesample = null;
    this._duration = null;
    this._samples = [];
}

Fragment.prototype.timescale = function(value) {
    if (value === undefined) {
        return this._timescale;
    }
    this._timescale = value;
};

Fragment.prototype.timesample = function(value) {
    if (value === undefined) {
        return this._timesample;
    }
    this._timesample = value;
};

Fragment.prototype.timestamp = function() {
    if (this._timescale) {
        return this._timesample / this._timescale;
    } else {
        return this._timesample;
    }
};

Fragment.prototype.duration = function(value) {
    if (value === undefined) {
        return this._duration;
    }
    this._duration = value;
};

Fragment.prototype.effectiveDuration = function() {
    if (this._timescale) {
        return this._duration / this._timescale;
    }
    return this._duration || 0;
};

Fragment.prototype.samples = function(value) {
    if (value === undefined) {
        return this._samples;
    }
    this._samples = value;
};

Fragment.prototype.addSample = function(sample) {
    this._samples.push(sample);
};

module.exports = Fragment;
