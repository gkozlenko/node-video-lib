'use strict';

var MP4Parser = require('../index');

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;

var MP4_FILE = './resources/boomstream.mp4';
var INVALID_FILE = './resources/picture.jpg';

var movie = null;

describe('node-mp4-parser', function () {
    this.timeout(10000);

    beforeEach(function() {
        return MP4Parser.parse(MP4_FILE).then(function(data) {
            movie = data;
        });
    });

    afterEach(function() {
        return movie.close();
    });

    describe('parse', function () {

        it('should throw an error when opens a non existing file', function () {
            return expect(MP4Parser.parse('/file/not/exists.mp4')).to.be.rejected;
        });

        it('should throw an error when opens a not mp4 file', function () {
            return expect(MP4Parser.parse(INVALID_FILE)).to.be.rejected;
        });

        it('should not throw an error when opens an existing file', function () {
            return expect(MP4Parser.parse(MP4_FILE)).to.be.fulfilled;
        });

    });

    describe('size', function () {

        it('should return right file length', function () {
            return expect(movie.size).to.equal(16068581);
        });

    });

    describe('timescale', function () {

        it('should return right video timescale', function () {
            return expect(movie.timescale).to.equal(1000);
        });

    });

    describe('duration', function () {

        it('should return right video duration', function () {
            return expect(movie.duration).to.equal(61320);
        });

    });

});
