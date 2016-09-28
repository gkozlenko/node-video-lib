'use strict';

var MediaLib = require('../index');

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;

var MP4_FILE = './resources/boomstream.mp4';
var INVALID_FILE = './resources/picture.jpg';

describe('node-media-lib', function () {
    this.timeout(10000);

    describe('parse', function () {
        it('should throw an error when opens a non existing file', function () {
            return expect(MediaLib.parse('/file/not/exists.mp4')).to.be.rejected;
        });
        it('should throw an error when opens a not mp4 file', function () {
            return expect(MediaLib.parse(INVALID_FILE)).to.be.rejected;
        });
        it('should not throw an error when opens an existing file', function () {
            return expect(MediaLib.parse(MP4_FILE)).to.be.fulfilled;
        });
    });

    describe('movie', function () {
        var movie = null;

        before(function() {
            return MediaLib.parse(MP4_FILE).then(function(data) {
                movie = data;
            });
        });

        it('should return right effective duration', function () {
            return expect(movie.effectiveDuration()).to.be.within(61, 62);
        });
        it('should have two tracks', function () {
            return expect(movie.tracks().length).to.be.equal(2);
        });
        it('should have samples', function () {
            return expect(movie.samples().length).to.be.ok;
        });
        it('should have right number of samples', function () {
            return expect(movie.samples().length).to.be.equal(movie.videoTrack().samples().length + movie.audioTrack().samples().length);
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
                return expect(videoTrack.width()).to.be.equal(1280);
            });
            it('should have right height', function () {
                return expect(videoTrack.height()).to.be.equal(720);
            });
            it('should have right effective duration', function () {
                return expect(videoTrack.effectiveDuration()).to.be.within(61, 62);
            });
            it('should have extraData', function () {
                return expect(videoTrack.extraData()).to.be.ok;
            });
            it('should have samples', function () {
                return expect(videoTrack.samples().length).to.be.ok;
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
                return expect(audioTrack.channels()).to.be.equal(2);
            });
            it('should have right sampleRate', function () {
                return expect(audioTrack.sampleRate()).to.be.equal(44100);
            });
            it('should have right sampleSize', function () {
                return expect(audioTrack.sampleSize()).to.be.equal(16);
            });
            it('should have right effective duration', function () {
                return expect(audioTrack.effectiveDuration()).to.be.within(61, 62);
            });
            it('should have extraData', function () {
                return expect(audioTrack.extraData()).to.be.ok;
            });
            it('should have samples', function () {
                return expect(audioTrack.samples().length).to.be.ok;
            });
        });

        describe('fragments', function () {
            it('should have 6 fragments by 10 seconds', function () {
                var fragments = movie.fragments(10);
                return expect(fragments.length).to.be.equal(6);
            });
            it('should have 11 fragments by 5 seconds', function () {
                var fragments = movie.fragments(5);
                return expect(fragments.length).to.be.equal(11);
            });
        });
    });

});
