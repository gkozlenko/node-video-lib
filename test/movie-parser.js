'use strict';

const VideoLib = require('../index');
const MovieParser = VideoLib.MovieParser;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const MovieSupport = require('./support/movie');

const MP4_FILE = './resources/boomstream.mp4';
const FLV_FILE = './resources/boomstream.flv';
const INVALID_FILE = './resources/picture.jpg';

describe('MovieParser', function () {

    describe('#parse()', function () {
        describe('when source is a valid MP4 file', function () {
            before(function () {
                this.file = fs.openSync(MP4_FILE, 'r');
                this.movie = MovieParser.parse(this.file);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            MovieSupport.shouldBeValidMovie(MP4_FILE, 'avc1.64001f', 'mp4a.40.2');
        });

        describe('when source is a valid MP4 Buffer', function () {
            before(function () {
                this.file = fs.openSync(MP4_FILE, 'r');
                this.buffer = new Buffer(fs.fstatSync(this.file).size);
                fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
                this.movie = MovieParser.parse(this.buffer);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            MovieSupport.shouldBeValidMovie(MP4_FILE, 'avc1.64001f', 'mp4a.40.2');
        });

        describe('when source is a valid FLV file', function () {
            before(function () {
                this.file = fs.openSync(FLV_FILE, 'r');
                this.movie = MovieParser.parse(this.file);
            });

            after(function () {
                fs.closeSync(this.file);
            });

            MovieSupport.shouldBeValidMovie(FLV_FILE, 'avc1.64001f', 'mp4a.40.2');
        });

        describe('when source is a valid FLV Buffer', function () {
            before(function () {
                this.file = fs.openSync(FLV_FILE, 'r');
                this.buffer = new Buffer(fs.fstatSync(this.file).size);
                fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
                this.movie = MovieParser.parse(this.buffer);
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
                return expect(() => MovieParser.parse(this.file)).to.throw('Cannot parse movie file');
            });
        });
    });

});
