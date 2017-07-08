'use strict';

const VideoLib = require('../index');
const MP4Parser = VideoLib.MP4Parser;
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const FragmentListIndexer = VideoLib.FragmentListIndexer;
const FragmentReader = VideoLib.FragmentReader;
const HLSPacketizer = VideoLib.HLSPacketizer;

const fs = require('fs');
const os = require('os');
const path = require('path');
const chai = require('chai');
const faker = require('faker');
const expect = chai.expect;

const MP4_FILE = './resources/boomstream.mp4';
const INDEX_FILE = path.join(os.tmpdir(), path.basename(MP4_FILE) + '.idx');

describe('FragmentListIndexer', function () {
    before(function () {
        this.file = fs.openSync(MP4_FILE, 'r');
        this.indexFile = fs.openSync(INDEX_FILE, 'w+');
        this.movie = MP4Parser.parse(this.file);
    });

    after(function () {
        fs.closeSync(this.file);
        fs.closeSync(this.indexFile);
        fs.unlinkSync(INDEX_FILE);
    });

    describe('#index()', function () {
        before(function () {
            this.fragmentList = FragmentListBuilder.build(this.movie, faker.random.number({min: 3, max: 10}));
            FragmentListIndexer.index(this.fragmentList, this.indexFile);
        });

        it('should create an index file', function () {
            let buffer = new Buffer(4);
            fs.readSync(this.indexFile, buffer, 0, buffer.length, 0);
            return [
                expect(fs.fstatSync(this.indexFile).isFile()).to.be.equal(true),
                expect(fs.fstatSync(this.indexFile).size).to.be.above(0),
                expect(buffer.toString('ascii', 0, 3)).to.be.equal('idx'),
                expect(buffer[3]).to.be.equal(1)
            ];
        });
    });

    describe('#read()', function () {
        before(function () {
            this.fragmentList = FragmentListBuilder.build(this.movie, faker.random.number({min: 3, max: 10}));
            FragmentListIndexer.index(this.fragmentList, this.indexFile);
            this.readedFragmentList = FragmentListIndexer.read(this.indexFile);
        });

        it('should read general information', function () {
            return [
                expect(this.readedFragmentList.fragmentDuration).to.be.equal(this.fragmentList.fragmentDuration),
                expect(this.readedFragmentList.count()).to.be.equal(this.fragmentList.count()),
                expect(this.readedFragmentList.resolution()).to.be.equal(this.fragmentList.resolution()),
                expect(this.readedFragmentList.duration).to.be.equal(this.fragmentList.duration),
                expect(this.readedFragmentList.timescale).to.be.equal(this.fragmentList.timescale),
                expect(this.readedFragmentList.videoExtraData).to.be.deep.equal(this.fragmentList.videoExtraData),
                expect(this.readedFragmentList.audioExtraData).to.be.deep.equal(this.fragmentList.audioExtraData),
            ];
        });

        it('should read fragments data', function () {
            let number = faker.random.number({min: 0, max: this.fragmentList.count() - 1});
            let fragment = this.fragmentList.get(number);
            let sampleBuffers = FragmentReader.readSamples(fragment, this.file);
            let packet = HLSPacketizer.packetize(fragment, sampleBuffers);

            fragment = this.readedFragmentList.get(number);
            sampleBuffers = FragmentReader.readSamples(fragment, this.file);
            expect(HLSPacketizer.packetize(fragment, sampleBuffers)).to.be.deep.equal(packet);
        });
    });

});
