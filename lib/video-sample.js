'use strict';

var Sample = require('./sample');
var util = require('util');

function VideoSample() {
    Sample.apply(this, Array.prototype.slice.call(arguments));

    this.compositionOffset = null;
    this.isKeyframe = false;
}

util.inherits(VideoSample, Sample);

module.exports = VideoSample;
