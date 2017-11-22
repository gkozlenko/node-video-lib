'use strict';

const VideoLib = require('../index');
const MP4Parser = VideoLib.MP4Parser;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const MovieSupport = require('./support/movie');

const MP4_FILE = './resources/boomstream.mp4';
const MP4_HEVC_FILE = './resources/boomstream_hevc.mp4';
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

                MovieSupport.shouldBeValidMovie(FILE_NAME);
            });

            describe('when source is a valid Buffer', function () {
                before(function () {
                    this.file = fs.openSync(FILE_NAME, 'r');
                    this.buffer = new Buffer(fs.fstatSync(this.file).size);
                    fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
                    this.movie = MP4Parser.parse(this.buffer);
                });

                after(function () {
                    fs.closeSync(this.file);
                });

                MovieSupport.shouldBeValidMovie(FILE_NAME);
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

                MovieSupport.shouldBeValidMovie(FILE_NAME);
            });

            describe('when source is a valid Buffer', function () {
                before(function () {
                    this.file = fs.openSync(FILE_NAME, 'r');
                    this.buffer = new Buffer(fs.fstatSync(this.file).size);
                    fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
                    this.movie = MP4Parser.parse(this.buffer);
                });

                after(function () {
                    fs.closeSync(this.file);
                });

                MovieSupport.shouldBeValidMovie(FILE_NAME);
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
    });

});
