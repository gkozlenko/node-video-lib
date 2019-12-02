'use strict';

const VideoLib = require('../index');
const MovieParser = VideoLib.MovieParser;
const MP4Builder = VideoLib.MP4Builder;
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const FragmentListIndexer = VideoLib.FragmentListIndexer;
const FragmentReader = VideoLib.FragmentReader;
const HLSPacketizer = VideoLib.HLSPacketizer;

const fs = require('fs');
const tempy = require('tempy');

const MOVIE_FILE = './resources/boomstream.mp4';
const WARM_COUNT = 10;
const TEST_COUNT = 100;

describe('performance-test', function () {
    this.timeout(120000);

    before(function () {
        this.file = fs.openSync(MOVIE_FILE, 'r');
        this.outFile = tempy.file({extension: 'mp4'});
        this.out = fs.openSync(this.outFile, 'w');
        this.indexFile = tempy.file({extension: 'idx'});
        this.index = fs.openSync(this.indexFile, 'w+');
        for (let i = 0; i < WARM_COUNT; i++) {
            let movie = MovieParser.parse(this.file);
            let fragmentList = FragmentListBuilder.build(movie, 5);
            let fragment = fragmentList.get(0);
            let sampleBuffers = FragmentReader.readSamples(fragment, this.file);
            HLSPacketizer.packetize(fragment, sampleBuffers);
            FragmentListIndexer.index(fragmentList, this.index);
            FragmentListIndexer.read(this.index);
            MP4Builder.build(movie, this.file, this.out);
        }
    });

    after(function () {
        fs.closeSync(this.file);
        fs.closeSync(this.out);
        fs.unlinkSync(this.outFile);
        fs.closeSync(this.index);
        fs.unlinkSync(this.indexFile);
    });

    it('performance', function () {
        let parseTime = 0, buildTime = 0, fragmentBuildTime = 0, readerTime = 0, packetizeTime = 0, indexTime = 0, indexReaderTime = 0;
        let startTime, endTime;

        for (let i = 0; i < TEST_COUNT; i++) {
            // Parser
            startTime = Date.now();
            let movie = MovieParser.parse(this.file);
            endTime = Date.now();
            parseTime += endTime - startTime;

            // Fragment Builder
            startTime = Date.now();
            let fragmentList = FragmentListBuilder.build(movie, 10);
            endTime = Date.now();
            fragmentBuildTime += endTime - startTime;

            // Reader
            startTime = Date.now();
            let fragment = fragmentList.get(0);
            let sampleBuffers = FragmentReader.readSamples(fragment, this.file);
            endTime = Date.now();
            readerTime += endTime - startTime;

            // Packetizer
            startTime = Date.now();
            HLSPacketizer.packetize(fragment, sampleBuffers);
            endTime = Date.now();
            packetizeTime += endTime - startTime;

            // Indexer
            startTime = Date.now();
            FragmentListIndexer.index(fragmentList, this.index);
            endTime = Date.now();
            indexTime += endTime - startTime;

            // Index Reader
            startTime = Date.now();
            FragmentListIndexer.read(this.index);
            endTime = Date.now();
            indexReaderTime += endTime - startTime;

            // Builder
            startTime = Date.now();
            MP4Builder.build(movie, this.file, this.out);
            endTime = Date.now();
            buildTime += endTime - startTime;
        }

        let totalTime = parseTime + fragmentBuildTime + readerTime + packetizeTime;

        console.log('---------------------');
        console.log(`Parser: ${(parseTime / TEST_COUNT).toFixed(2)} ms (${(100 * parseTime / totalTime).toFixed(2)}%)`);
        console.log(`Fragment Builder: ${(fragmentBuildTime / TEST_COUNT).toFixed(2)} ms (${(100 * fragmentBuildTime / totalTime).toFixed(2)}%)`);
        console.log(`Reader: ${(readerTime / TEST_COUNT).toFixed(2)} ms (${(100 * readerTime / totalTime).toFixed(2)}%)`);
        console.log(`Packetizer: ${(packetizeTime / TEST_COUNT).toFixed(2)} ms (${(100 * packetizeTime / totalTime).toFixed(2)}%)`);
        console.log('---------------------');
        console.log(`Builder: ${(buildTime / TEST_COUNT).toFixed(2)} ms`);
        console.log('---------------------');
        console.log(`Indexer: ${(indexTime / TEST_COUNT).toFixed(2)} ms`);
        console.log(`Index Reader: ${(indexReaderTime / TEST_COUNT).toFixed(2)} ms`);
        console.log('---------------------');
        console.log(`Memory Used: ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`);
    });

});
