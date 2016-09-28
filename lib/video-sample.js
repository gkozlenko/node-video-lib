'use strict';

var Sample = require('./sample');
var util = require('util');

function VideoSample() {
    Sample.apply(this, Array.prototype.slice.call(arguments));

    this._compositionOffset = null;
    this._keyframe = false;
}

util.inherits(VideoSample, Sample);

VideoSample.prototype.compositionOffset = function(value) {
    if (value === undefined) {
        return this._compositionOffset;
    }
    this._compositionOffset = value;
};

VideoSample.prototype.keyframe = function(value) {
    if (value === undefined) {
        return this._keyframe;
    }
    this._keyframe = value;
};

module.exports = VideoSample;
