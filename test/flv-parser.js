'use strict';

const VideoLib = require('../index');
const FLVParser = VideoLib.FLVParser;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const MovieSupport = require('./support/movie');

const FLV_FILE = './resources/boomstream.flv';
const MP4_FILE = './resources/boomstream.mp4';
const INVALID_FILE = './resources/picture.jpg';

describe('FLVParser', function () {

    describe('#parse()', function () {
        describe('when source is a valid file', function () {
            before(function () {
                this.file = fs.openSync(FLV_FILE, 'r');
                this.movie = FLVParser.parse(this.file);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            MovieSupport.shouldBeValidMovie(FLV_FILE, 'avc1.64001f', 'mp4a.40.2');
        });

        describe('when source is a valid Buffer', function () {
            before(function () {
                this.file = fs.openSync(FLV_FILE, 'r');
                this.buffer = new Buffer(fs.fstatSync(this.file).size);
                fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
                this.movie = FLVParser.parse(this.buffer);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            MovieSupport.shouldBeValidMovie(FLV_FILE, 'avc1.64001f', 'mp4a.40.2');
        });

        describe('when source is not valid', function () {
            before(function () {
                this.file = fs.openSync(INVALID_FILE, 'r');
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should throws an error', function () {
                return expect(() => FLVParser.parse(this.file)).to.throw('FLV header not found');
            });
        });

        describe('when source is MP4 file', function () {
            before(function () {
                this.file = fs.openSync(MP4_FILE, 'r');
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should throws an error', function () {
                return expect(() => FLVParser.parse(this.file)).to.throw('FLV header not found');
            });
        });
    });

    describe('#check', function () {
        describe('when buffer contains header of FLV file', function () {
            before(function () {
                this.file = fs.openSync(FLV_FILE, 'r');
                this.buffer = new Buffer(8);
                fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should return true', function () {
                expect(FLVParser.check(this.buffer)).to.be.equal(true);
            });
        });

        describe('when buffer contains header of MP4 file', function () {
            before(function () {
                this.file = fs.openSync(MP4_FILE, 'r');
                this.buffer = new Buffer(8);
                fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should return false', function () {
                expect(FLVParser.check(this.buffer)).to.be.equal(false);
            });
        });

        describe('when buffer contains header of invalid file', function () {
            before(function () {
                this.file = fs.openSync(INVALID_FILE, 'r');
                this.buffer = new Buffer(8);
                fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            it('should return false', function () {
                expect(FLVParser.check(this.buffer)).to.be.equal(false);
            });
        });
    });

});
