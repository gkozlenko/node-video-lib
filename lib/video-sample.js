'use strict';

var util = require('util');

var Sample = require('./sample');
var MediaUtil = require('./media-util');

function VideoSample() {
    Sample.apply(this, Array.prototype.slice.call(arguments));

    this._compositionOffset = null;
    this._keyframe = false;
}

util.inherits(VideoSample, Sample);
MediaUtil.generateMethods(VideoSample.prototype, ['compositionOffset', 'keyframe']);

module.exports = VideoSample;
