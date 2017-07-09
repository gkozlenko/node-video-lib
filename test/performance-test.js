'use strict';

const VideoLib = require('../index');
const MovieParser = VideoLib.MovieParser;
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const FragmentReader = VideoLib.FragmentReader;
const HLSPacketizer = VideoLib.HLSPacketizer;

const fs = require('fs');

const MOVIE_FILE = './resources/boomstream.mp4';
const WARM_COUNT = 1;
const TEST_COUNT = 40;

describe('performance-test', function () {
    this.timeout(120000);

    before(function () {
        this.file = fs.openSync(MOVIE_FILE, 'r');
        for (let i = 0; i < WARM_COUNT; i++) {
            let movie = MovieParser.parse(this.file);
            let fragmentList = FragmentListBuilder.build(movie, 5);
            let fragment = fragmentList.get(0);
            let sampleBuffers = FragmentReader.readSamples(fragment, this.file);
            HLSPacketizer.packetize(fragment, sampleBuffers);
        }
    });

    after(function () {
        fs.closeSync(this.file);
    });

    it('performance', function () {
        let parseTime = 0, buildTime = 0, readerTime = 0, packetizeTime = 0;
        let startTime, endTime;

        for (let i = 0; i < TEST_COUNT; i++) {
            startTime = Date.now();
            let movie = MovieParser.parse(this.file);
            endTime = Date.now();
            parseTime += endTime - startTime;

            startTime = Date.now();
            let fragmentList = FragmentListBuilder.build(movie, 5);
            let fragment = fragmentList.get(0);
            endTime = Date.now();
            buildTime += endTime - startTime;

            startTime = Date.now();
            let sampleBuffers = FragmentReader.readSamples(fragment, this.file);
            endTime = Date.now();
            readerTime += endTime - startTime;

            startTime = Date.now();
            HLSPacketizer.packetize(fragment, sampleBuffers);
            endTime = Date.now();
            packetizeTime += endTime - startTime;
        }

        console.log(`Parser: ${parseTime / TEST_COUNT} ms`);
        console.log(`Builder: ${buildTime / TEST_COUNT} ms`);
        console.log(`Reader: ${readerTime / TEST_COUNT} ms`);
        console.log(`Packetizer: ${packetizeTime / TEST_COUNT} ms`);
    });

});
