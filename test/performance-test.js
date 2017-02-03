'use strict';

const VideoLib = require('../index');
const MP4Parser = VideoLib.MP4Parser;
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const HLSPacketizer = VideoLib.HLSPacketizer;

const fs = require('fs');

const MP4_FILE = './resources/boomstream.mp4';
const WARM_COUNT = 3;

describe('performance-test', function() {
    this.timeout(60000);

    before(function() {
        this.file = fs.openSync(MP4_FILE, 'r');
        for (let i = 0; i < WARM_COUNT; i++) {
            let movie = MP4Parser.parse(this.file);
            let fragmentList = FragmentListBuilder.build(movie, 5);
            HLSPacketizer.packetize(fragmentList.get(0), this.file);
        }
    });

    after(function() {
        fs.closeSync(this.file);
    });

    it('performance', function() {
        let startTime, endTime;

        startTime = Date.now();
        let movie = MP4Parser.parse(this.file);
        endTime = Date.now();
        console.log(`Parser: ${endTime - startTime} ms`);

        startTime = Date.now();
        let fragmentList = FragmentListBuilder.build(movie, 5);
        endTime = Date.now();
        console.log(`Builder: ${endTime - startTime} ms`);

        startTime = Date.now();
        HLSPacketizer.packetize(fragmentList.get(0), this.file);
        endTime = Date.now();
        console.log(`Packetizer: ${endTime - startTime} ms`);
    });

});
