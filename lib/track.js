'use strict';

var Sample = require('./sample');

function Track() {
    this.timescale = null;
    this.duration = null;
    this.extraData = null;
    this.samples = [];
}

Track.prototype.addSample = function(sample) {
    this.samples.push(sample);
};

Track.prototype.createSample = function() {
    return new Sample();
};

module.exports = Track;
