'use strict';

const VideoLib = require('../index');
const DASHPacketizer = VideoLib.DASHPacketizer;

const PacketizerSupport = require('./support/packetizer');

const MOVIE_FILE = './resources/boomstream.mp4';

describe('DASHPacketizer', function () {
    PacketizerSupport.shouldBeValidPacketizer(MOVIE_FILE, DASHPacketizer);
});
