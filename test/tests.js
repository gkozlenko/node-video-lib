'use strict';

var MP4Parser = require('../index');

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;

var MP4_FILE = './resources/boomstream.mp4';
var INVALID_FILE = './resources/picture.jpg';

describe('node-mp4-parser', function () {
    this.timeout(10000);

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

    describe('movie', function () {
        var movie = null;

        before(function() {
            return MP4Parser.parse(MP4_FILE).then(function(data) {
                movie = data;
            });
        });

        it('should return right timescale and duration', function () {
            return expect(movie.duration / movie.timescale).to.be.within(61, 62);
        });
        it('should have two tracks', function () {
            return expect(movie.tracks.length).to.equal(2);
        });

        describe('videoTrack', function () {
            var videoTrack = null;

            before(function() {
                videoTrack = movie.videoTrack();
            });

            it('should be present', function () {
                return expect(videoTrack).to.be.ok;
            });
            it('should have right width', function () {
                return expect(videoTrack.width).to.equal(1280);
            });
            it('should have right height', function () {
                return expect(videoTrack.height).to.equal(720);
            });
            it('should have right timescale and duration', function () {
                return expect(videoTrack.duration / videoTrack.timescale).to.be.within(61, 62);
            });
            it('should have extraData', function () {
                return expect(videoTrack.extraData).to.be.ok;
            });
        });

        describe('audioTrack', function () {
            var audioTrack = null;

            before(function() {
                audioTrack = movie.audioTrack();
            });

            it('should be present', function () {
                return expect(audioTrack).to.be.ok;
            });
            it('should have right channels', function () {
                return expect(audioTrack.channels).to.equal(2);
            });
            it('should have right sampleRate', function () {
                return expect(audioTrack.sampleRate).to.equal(44100);
            });
            it('should have right sampleSize', function () {
                return expect(audioTrack.sampleSize).to.equal(16);
            });
            it('should have right timescale and duration', function () {
                return expect(audioTrack.duration / audioTrack.timescale).to.be.within(61, 62);
            });
            it('should have extraData', function () {
                return expect(audioTrack.extraData).to.be.ok;
            });
        });
    });

});
