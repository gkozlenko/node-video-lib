'use strict';

const VideoLib = require('../index');
const MP4Parser = VideoLib.MP4Parser;
const HLSPacketizer = VideoLib.HLSPacketizer;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const MP4_FILE = './resources/boomstream.mp4';

describe('HLSPacketizer', function() {
    before(function() {
        this.file = fs.openSync(MP4_FILE, 'r');
        this.movie = MP4Parser.parse(this.file);
    });

    after(function() {
        fs.closeSync(this.file);
    });

    describe('#packetize()', function() {
        describe('when fragment is valid', function() {
            before(function() {
                this.fragment = this.movie.fragments(5)[0];
            });

            it('should return a buffer object', function() {
                return expect(HLSPacketizer.packetize(this.fragment)).to.be.instanceof(Buffer);
            });

            it('should have right size', function() {
                let size = this.fragment.samples.reduce(function(size, sample) {
                    return size + sample.size;
                }, 0);
                return expect(HLSPacketizer.packetize(this.fragment).length).to.be.above(size);
            });
        });

        describe('when fragment is invalid', function() {
            it('should throws an error', function() {
                return expect(() => HLSPacketizer.packetize('Some string')).to.throw('Argument 1 should be instance of Fragment');
            });
        });
    });

});
