'use strict';

const VideoLib = require('../index');
const MovieParser = VideoLib.MovieParser;
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const FragmentListIndexer = VideoLib.FragmentListIndexer;
const FragmentReader = VideoLib.FragmentReader;
const HLSPacketizer = VideoLib.HLSPacketizer;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const Utils = require('./lib/utils');

const MOVIE_FILE = './resources/boomstream.mp4';

describe('FragmentListIndexer', function () {
    before(function () {
        this.fileName = Utils.tempFile('idx');
        this.file = fs.openSync(MOVIE_FILE, 'r');
        this.indexFile = fs.openSync(this.fileName, 'w+');
        this.movie = MovieParser.parse(this.file);
    });

    after(function () {
        fs.closeSync(this.file);
        fs.closeSync(this.indexFile);
        fs.unlinkSync(this.fileName);
    });

    describe('#index()', function () {
        before(function () {
            this.fragmentList = FragmentListBuilder.build(this.movie, Utils.randInt(3, 10));
            FragmentListIndexer.index(this.fragmentList, this.indexFile);
        });

        it('should create an index file', function () {
            let buffer = Buffer.allocUnsafe(4);
            fs.readSync(this.indexFile, buffer, 0, buffer.length, 0);
            return [
                expect(fs.fstatSync(this.indexFile).isFile()).to.be.equal(true),
                expect(fs.fstatSync(this.indexFile).size).to.be.above(0),
                expect(buffer.toString('ascii', 0, 3)).to.be.equal('idx'),
                expect(buffer[3]).to.be.equal(2),
            ];
        });
    });

    describe('#read()', function () {
        before(function () {
            this.fragmentList = FragmentListBuilder.build(this.movie, Utils.randInt(3, 10));
            FragmentListIndexer.index(this.fragmentList, this.indexFile);
            this.readedFragmentList = FragmentListIndexer.read(this.indexFile);
        });

        it('should read general information', function () {
            return [
                expect(this.readedFragmentList.fragmentDuration).to.be.equal(this.fragmentList.fragmentDuration),
                expect(this.readedFragmentList.count()).to.be.equal(this.fragmentList.count()),
                expect(this.readedFragmentList.size()).to.be.equal(this.fragmentList.size()),
                expect(this.readedFragmentList.duration).to.be.equal(this.fragmentList.duration),
                expect(this.readedFragmentList.timescale).to.be.equal(this.fragmentList.timescale),
                expect(this.readedFragmentList.video).to.be.deep.equal(this.fragmentList.video),
                expect(this.readedFragmentList.audio).to.be.deep.equal(this.fragmentList.audio),
            ];
        });

        it('should read fragments data', function () {
            let number = Utils.randInt(0, this.fragmentList.count() - 1);
            let fragment = this.fragmentList.get(number);
            let sampleBuffers = FragmentReader.readSamples(fragment, this.file);
            let packet = HLSPacketizer.packetize(fragment, sampleBuffers);

            fragment = this.readedFragmentList.get(number);
            sampleBuffers = FragmentReader.readSamples(fragment, this.file);
            expect(HLSPacketizer.packetize(fragment, sampleBuffers)).to.be.deep.equal(packet);
        });
    });

});
