'use strict';

const VideoLib = require('../index');
const MP4Parser = VideoLib.MP4Parser;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const MovieSupport = require('./support/movie');

const MP4_FILE = './resources/boomstream.mp4';
const MP4_HEVC_FILE = './resources/boomstream_hevc.mp4';
const FLV_FILE = './resources/boomstream.flv';
const INVALID_FILE = './resources/picture.jpg';

describe('MP4Parser', function () {

    describe('#parse()', function () {

        describe('h264/aac', function () {
            const FILE_NAME = MP4_FILE;

            describe('when source is a valid file', function () {
                before(function () {
                    this.file = fs.openSync(FILE_NAME, 'r');
                    this.movie = MP4Parser.parse(this.file);
                });

                after(function () {
                    fs.closeSync(this.file);
                });

                MovieSupport.shouldBeValidMovie(FILE_NAME, 'avc1.64001f', 'mp4a.40.2');
            });

            describe('when source is a valid Buffer', function () {
                before(function () {
                    this.file = fs.openSync(FILE_NAME, 'r');
                    this.buffer = Buffer.allocUnsafe(fs.fstatSync(this.file).size);
                    fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
                    this.movie = MP4Parser.parse(this.buffer);
                });

                after(function () {
                    fs.closeSync(this.file);
                });

                MovieSupport.shouldBeValidMovie(FILE_NAME, 'avc1.64001f', 'mp4a.40.2');
            });
        });

        describe('h265/aac', function () {
            const FILE_NAME = MP4_HEVC_FILE;

            describe('when source is a valid file', function () {
                before(function () {
                    this.file = fs.openSync(FILE_NAME, 'r');
                    this.movie = MP4Parser.parse(this.file);
                });

                after(function () {
                    fs.closeSync(this.file);
                });

                MovieSupport.shouldBeValidMovie(FILE_NAME, 'hvc1.1.6.L93.9', 'mp4a.40.2');
            });

            describe('when source is a valid Buffer', function () {
                before(function () {
                    this.file = fs.openSync(FILE_NAME, 'r');
                    this.buffer = Buffer.allocUnsafe(fs.fstatSync(this.file).size);
                    fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
                    this.movie = MP4Parser.parse(this.buffer);
                });

                after(function () {
                    fs.closeSync(this.file);
                });

                MovieSupport.shouldBeValidMovie(FILE_NAME, 'hvc1.1.6.L93.9', 'mp4a.40.2');
            });
        });

        describe('when source is not valid', function () {
            before(function () {
                this.file = fs.openSync(INVALID_FILE, 'r');
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should throws an error', function () {
                return expect(() => MP4Parser.parse(this.file)).to.throw('MOOV atom not found');
            });
        });

        describe('when source is FLV file', function () {
            before(function () {
                this.file = fs.openSync(FLV_FILE, 'r');
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should throws an error', function () {
                return expect(() => MP4Parser.parse(this.file)).to.throw('MOOV atom not found');
            });
        });
    });

    describe('#check', function () {
        describe('when buffer contains header of MP4 file', function () {
            before(function () {
                this.file = fs.openSync(MP4_FILE, 'r');
                this.buffer = Buffer.allocUnsafe(8);
                fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should return true', function () {
                expect(MP4Parser.check(this.buffer)).to.be.equal(true);
            });
        });

        describe('when buffer contains header of FLV file', function () {
            before(function () {
                this.file = fs.openSync(FLV_FILE, 'r');
                this.buffer = Buffer.allocUnsafe(8);
                fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should return false', function () {
                expect(MP4Parser.check(this.buffer)).to.be.equal(false);
            });
        });

        describe('when buffer contains header of invalid file', function () {
            before(function () {
                this.file = fs.openSync(INVALID_FILE, 'r');
                this.buffer = Buffer.allocUnsafe(8);
                fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should return false', function () {
                expect(MP4Parser.check(this.buffer)).to.be.equal(false);
            });
        });
    });

});
