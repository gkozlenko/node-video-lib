'use strict';

var Sample = require('./sample');
var MediaUtil = require('./media-util');

function Track() {
    this._timescale = null;
    this._duration = null;
    this._extraData = null;
    this._samples = [];
}

MediaUtil.generateMethods(Track.prototype, ['timescale', 'duration', 'extraData', 'samples']);

Track.prototype.effectiveDuration = function() {
    if (this._timescale) {
        return this._duration / this._timescale;
    }
    return this._duration || 0;
};

Track.prototype.addSample = function(sample) {
    this._samples.push(sample);
};

Track.prototype.createSample = function() {
    return new Sample();
};

module.exports = Track;
