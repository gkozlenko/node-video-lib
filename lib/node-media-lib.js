'use strict';

var ParserMp4 = require('./parsers/parser-mp4');
var Movie = require('./movie');
var Track = require('./track');
var VideoTrack = require('./video-track');
var AudioTrack = require('./audio-track');
var Sample = require('./sample');
var VideoSample = require('./video-sample');
var AudioSample = require('./audio-sample');
var Fragment = require('./fragment');
var PacketizerHLS = require('./packetizers/packetizer-hls');

function parseVideo(fileName) {
    var parser = new ParserMp4(fileName);
    return parser.parse();
}

function packetizeFragment(fragment) {
    var packetizer = new PacketizerHLS(fragment);
    return packetizer.packetize();
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

    parse: parseVideo,
    packetize: packetizeFragment
};
