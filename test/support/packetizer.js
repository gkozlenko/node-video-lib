'use strict';

const VideoLib = require('../../index');
const MovieParser = VideoLib.MovieParser;
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const FragmentReader = VideoLib.FragmentReader;

const fs = require('fs');
const chai = require('chai');
const faker = require('faker');
const expect = chai.expect;

const shouldBeValidPacketizer = function (movieFile, Packetizer) {

    before(function () {
        this.file = fs.openSync(movieFile, 'r');
        this.movie = MovieParser.parse(this.file);
    });

    after(function () {
        fs.closeSync(this.file);
    });

    describe('#packetize()', function () {
        describe('when fragment is valid', function () {
            before(function () {
                let fragmentList = FragmentListBuilder.build(this.movie, faker.random.number({min: 3, max: 10}));
                this.fragment = fragmentList.get(faker.random.number({min: 0, max: fragmentList.count() - 1}));
                this.sampleBuffers = FragmentReader.readSamples(this.fragment, this.file);
            });

            it('should return a buffer object', function () {
                return expect(Packetizer.packetize(this.fragment, this.sampleBuffers)).to.be.instanceof(Buffer);
            });

            it('should have right size', function () {
                let size = this.fragment.samples.reduce(function (size, sample) {
                    return size + sample.size;
                }, 0);
                return expect(Packetizer.packetize(this.fragment, this.sampleBuffers).length).to.be.above(size);
            });
        });

        describe('when fragment is not valid', function () {
            it('should throws an error', function () {
                return expect(() => Packetizer.packetize('Some string', this.sampleBuffers)).to.throw('Argument 1 should be instance of Fragment');
            });
        });
    });

};

module.exports = {
    shouldBeValidPacketizer
};
