'use strict';

var Track = require('./track');
var VideoSample = require('./video-sample');
var util = require('util');

function VideoTrack() {
    Track.apply(this, Array.prototype.slice.call(arguments));

    this.width = null;
    this.height = null;
}

util.inherits(VideoTrack, Track);

VideoTrack.prototype.createSample = function() {
    return new VideoSample();
};

module.exports = VideoTrack;
