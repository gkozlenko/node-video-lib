'use strict';

var ParseMp4 = require('./parsers/parser-mp4');
var Movie = require('./movie');
var Track = require('./track');
var VideoTrack = require('./video-track');
var AudioTrack = require('./audio-track');
var Sample = require('./sample');
var VideoSample = require('./video-sample');
var AudioSample = require('./audio-sample');
var Fragment = require('./fragment');

function parseVideo(fileName) {
    var parser = new ParseMp4(fileName);
    return parser.parse();
}

module.exports = {
    Movie: Movie,
    Track: Track,
    VideoTrack: VideoTrack,
    AudioTrack: AudioTrack,
    Sample: Sample,
    VideoSample: VideoSample,
    AudioSample: AudioSample,
    Fragment: Fragment,

    parse: parseVideo
};
