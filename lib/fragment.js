'use strict';

var MediaUtil = require('./media-util');

function Fragment() {
    this._timescale = null;
    this._timesample = null;
    this._duration = null;
    this._samples = [];
}

MediaUtil.generateMethods(Fragment.prototype, ['timescale', 'timesample', 'duration', 'samples']);

Fragment.prototype.timestamp = function() {
    if (this._timescale) {
        return this._timesample / this._timescale;
    } else {
        return this._timesample;
    }
};

Fragment.prototype.effectiveDuration = function() {
    if (this._timescale) {
        return this._duration / this._timescale;
    }
    return this._duration || 0;
};

Fragment.prototype.addSample = function(sample) {
    this._samples.push(sample);
};

module.exports = Fragment;
