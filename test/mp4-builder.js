'use strict';

const VideoLib = require('../index');
const MP4Builder = VideoLib.MP4Builder;
const MP4Parser = VideoLib.MP4Parser;
const FLVParser = VideoLib.FLVParser;

const fs = require('fs');
const tempy = require('tempy');
const chai = require('chai');
const expect = chai.expect;

const MovieSupport = require('./support/movie');

const MP4_FILE = './resources/boomstream.mp4';
const FLV_FILE = './resources/boomstream.flv';

describe('MP4Builder', function () {

    describe('#build()', function () {

        describe('when source is MP4 file', function () {
            before(function () {
                let file = fs.openSync(MP4_FILE, 'r');
                let movie = MP4Parser.parse(file);

                this.fileName = tempy.file({extension: 'mp4'});
                let outFile = fs.openSync(this.fileName, 'w');
                MP4Builder.build(movie, file, outFile);
                fs.closeSync(outFile);
                fs.closeSync(file);

                this.file = fs.openSync(this.fileName, 'r');
                this.movie = MP4Parser.parse(this.file);
                console.log(this.movie);
            });

            after(function () {
                fs.closeSync(this.file);
                fs.unlinkSync(this.fileName);
            });

            MovieSupport.shouldBeValidMovie(MP4_FILE, 'avc1.64001f', 'mp4a.40.2');
        });

        // describe('when source is FLV file', function () {
        //     const FILE_NAME = MP4_HEV1_FILE;
        //
        //     describe('when source is a valid file', function () {
        //         before(function () {
        //             this.file = fs.openSync(FILE_NAME, 'r');
        //             this.movie = MP4Parser.parse(this.file);
        //         });
        //
        //         after(function () {
        //             fs.closeSync(this.file);
        //         });
        //
        //         MovieSupport.shouldBeValidMovie(FILE_NAME, 'hvc1.1.6.L93.9', 'mp4a.40.2');
        //     });
        //
        //     describe('when source is a valid Buffer', function () {
        //         before(function () {
        //             this.file = fs.openSync(FILE_NAME, 'r');
        //             this.buffer = Buffer.allocUnsafe(fs.fstatSync(this.file).size);
        //             fs.readSync(this.file, this.buffer, 0, this.buffer.length, 0);
        //             this.movie = MP4Parser.parse(this.buffer);
        //         });
        //
        //         after(function () {
        //             fs.closeSync(this.file);
        //         });
        //
        //         MovieSupport.shouldBeValidMovie(FILE_NAME, 'hvc1.1.6.L93.9', 'mp4a.40.2');
        //     });
        // });

    });

});
