'use strict';

var util = require('util');

var Track = require('./track');
var VideoSample = require('./video-sample');
var MediaUtil = require('./media-util');

function VideoTrack() {
    Track.apply(this, Array.prototype.slice.call(arguments));

    this._width = null;
    this._height = null;
}

util.inherits(VideoTrack, Track);
MediaUtil.generateMethods(VideoTrack.prototype, ['width', 'height']);

VideoTrack.prototype.createSample = function() {
    return new VideoSample();
};

module.exports = VideoTrack;
