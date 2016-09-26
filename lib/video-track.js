'use strict';

var Track = require('./track');
var util = require('util');

function VideoTrack() {
    Track.apply(this, Array.prototype.slice.call(arguments));

    this.width = null;
    this.height = null;
}

util.inherits(VideoTrack, Track);

VideoTrack.prototype.createSample = function() {
    //
};

module.exports = VideoTrack;
