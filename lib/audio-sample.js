'use strict';

var Sample = require('./sample');
var util = require('util');

function AudioSample() {
    Sample.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AudioSample, Sample);

module.exports = AudioSample;
