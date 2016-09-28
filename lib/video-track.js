'use strict';

var Track = require('./track');
var VideoSample = require('./video-sample');
var util = require('util');

function VideoTrack() {
    Track.apply(this, Array.prototype.slice.call(arguments));

    this._width = null;
    this._height = null;
}

util.inherits(VideoTrack, Track);

VideoTrack.prototype.width = function(value) {
    if (value === undefined) {
        return this._width;
    }
    this._width = value;
};

VideoTrack.prototype.height = function(value) {
    if (value === undefined) {
        return this._height;
    }
    this._height = value;
};

VideoTrack.prototype.createSample = function() {
    return new VideoSample();
};

module.exports = VideoTrack;
