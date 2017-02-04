'use strict';

const VideoLib = require('../index');
const MP4Parser = VideoLib.MP4Parser;
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const HLSPacketizer = VideoLib.HLSPacketizer;

const fs = require('fs');

const MP4_FILE = './resources/boomstream.mp4';
const WARM_COUNT = 10;
const TEST_COUNT = 20;

describe('performance-test', function() {
    this.timeout(120000);

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
        let parseTime = 0, buildTime = 0, packetizeTime = 0;
        let startTime, endTime;

        for (let i = 0; i < TEST_COUNT; i++) {
            startTime = Date.now();
            let movie = MP4Parser.parse(this.file);
            endTime = Date.now();
            parseTime += endTime - startTime;

            startTime = Date.now();
            let fragmentList = FragmentListBuilder.build(movie, 5);
            endTime = Date.now();
            buildTime += endTime - startTime;

            startTime = Date.now();
            HLSPacketizer.packetize(fragmentList.get(0), this.file);
            endTime = Date.now();
            packetizeTime += endTime - startTime;
        }

        console.log(`Parser: ${parseTime / TEST_COUNT} ms`);
        console.log(`Builder: ${buildTime / TEST_COUNT} ms`);
        console.log(`Packetizer: ${packetizeTime / TEST_COUNT} ms`);
    });

});
