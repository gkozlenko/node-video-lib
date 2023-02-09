'use strict';

const VideoLib = require('../index');
const MP4Builder = VideoLib.MP4Builder;
const MP4Parser = VideoLib.MP4Parser;
const FLVParser = VideoLib.FLVParser;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const Utils = require('./lib/utils');
const MovieSupport = require('./support/movie');

const MP4_FILE = './resources/boomstream.mp4';
const FLV_FILE = './resources/boomstream.flv';

describe('MP4Builder', function () {

    describe('#build()', function () {

        describe('when source is MP4 file', function () {
            before(function () {
                let file = fs.openSync(MP4_FILE, 'r');
                let movie = MP4Parser.parse(file);

                this.fileName = Utils.tempFile('mp4');
                let outFile = fs.openSync(this.fileName, 'w');
                MP4Builder.build(movie, file, outFile);
                fs.closeSync(outFile);
                fs.closeSync(file);

                this.file = fs.openSync(this.fileName, 'r');
                this.movie = MP4Parser.parse(this.file);
            });

            after(function () {
                fs.closeSync(this.file);
                fs.unlinkSync(this.fileName);
            });

            MovieSupport.shouldBeValidMovie(MP4_FILE, 'avc1.64001f', 'mp4a.40.2');
        });

        describe('when source is FLV file', function () {
            before(function () {
                let file = fs.openSync(FLV_FILE, 'r');
                let movie = FLVParser.parse(file);

                this.fileName = Utils.tempFile('mp4');
                let outFile = fs.openSync(this.fileName, 'w');
                MP4Builder.build(movie, file, outFile);
                fs.closeSync(outFile);
                fs.closeSync(file);

                this.file = fs.openSync(this.fileName, 'r');
                this.movie = MP4Parser.parse(this.file);
            });

            after(function () {
                fs.closeSync(this.file);
                fs.unlinkSync(this.fileName);
            });

            MovieSupport.shouldBeValidMovie(FLV_FILE, 'avc1.64001f', 'mp4a.40.2');
        });

        describe('when source is not Movie', function () {
            before(function () {
                this.file = fs.openSync(MP4_FILE, 'r');
                this.fileName = Utils.tempFile('mp4');
                this.outFile = fs.openSync(this.fileName, 'w');
            });

            after(function () {
                fs.closeSync(this.file);
                fs.closeSync(this.outFile);
                fs.unlinkSync(this.fileName);
            });

            it('should throws an error', function () {
                return expect(() => MP4Builder.build('Some string', this.file, this.outFile)).to.throw('Argument 1 should be instance of Movie');
            });
        });

    });

});
