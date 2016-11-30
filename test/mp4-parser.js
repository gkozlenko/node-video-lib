'use strict';

const VideoLib = require('../index');
const MP4Parser = VideoLib.MP4Parser;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const MP4_FILE = './resources/boomstream.mp4';
const INVALID_FILE = './resources/picture.jpg';

describe('MP4Parser', function() {

    describe('#parse()', function() {
        describe('when file is valid', function() {
            before(function() {
                this.file = fs.openSync(MP4_FILE, 'r');
            });

            after(function() {
                fs.closeSync(this.file);
            });

            it('should return a movie object', function() {
                return expect(MP4Parser.parse(this.file)).to.be.instanceof(VideoLib.Movie);
            });
        });

        describe('when file is invalid', function() {
            before(function() {
                this.file = fs.openSync(INVALID_FILE, 'r');
            });

            after(function() {
                fs.closeSync(this.file);
            });

            it('should throws an error', function() {
                return expect(() => MP4Parser.parse(this.file)).to.throw('MOOV atom not found');
            });
        });
    });

    describe('movie', function() {
        before(function() {
            this.file = fs.openSync(MP4_FILE, 'r');
            this.movie = MP4Parser.parse(this.file);
        });

        after(function() {
            fs.closeSync(this.file);
        });

        it('should have right relative duration value', function() {
            return expect(this.movie.relativeDuration()).to.be.within(61, 62);
        });
        it('should have two tracks', function() {
            return expect(this.movie.tracks.length).to.be.equal(2);
        });
        it('should have samples', function() {
            return expect(this.movie.samples().length).to.be.ok;
        });
        it('should have right number of samples', function() {
            return expect(this.movie.samples().length).to.be.equal(this.movie.videoTrack().samples.length + this.movie.audioTrack().samples.length);
        });
        it('should have right samples size', function() {
            let size = this.movie.samples().reduce(function(size, sample) {
                return size + sample.size;
            }, 0);
            return expect(fs.statSync(MP4_FILE).size).to.be.above(size);
        });

        describe('#videoTrack()', function() {
            before(function() {
                this.videoTrack = this.movie.videoTrack();
            });

            it('should be present', function() {
                return expect(this.videoTrack).to.be.ok;
            });
            it('should have right width', function() {
                return expect(this.videoTrack.width).to.be.equal(1280);
            });
            it('should have right height', function() {
                return expect(this.videoTrack.height).to.be.equal(720);
            });
            it('should have right relative duration value', function() {
                return expect(this.videoTrack.relativeDuration()).to.be.within(61, 62);
            });
            it('should have extraData', function() {
                return expect(this.videoTrack.extraData).to.be.ok;
            });
            it('should have samples', function() {
                return expect(this.videoTrack.samples.length).to.be.ok;
            });
        });

        describe('#audioTrack()', function() {
            before(function() {
                this.audioTrack = this.movie.audioTrack();
            });

            it('should be present', function() {
                return expect(this.audioTrack).to.be.ok;
            });
            it('should have right channels', function() {
                return expect(this.audioTrack.channels).to.be.equal(2);
            });
            it('should have right sampleRate', function() {
                return expect(this.audioTrack.sampleRate).to.be.equal(44100);
            });
            it('should have right sampleSize', function() {
                return expect(this.audioTrack.sampleSize).to.be.equal(16);
            });
            it('should have right relative duration value', function() {
                return expect(this.audioTrack.relativeDuration()).to.be.within(61, 62);
            });
            it('should have extraData', function() {
                return expect(this.audioTrack.extraData).to.be.ok;
            });
            it('should have samples', function() {
                return expect(this.audioTrack.samples.length).to.be.ok;
            });
        });

        describe('#fragments()', function() {
            it('should have 6 fragments by 10 seconds', function() {
                return expect(this.movie.fragments(10).length).to.be.equal(6);
            });
            it('should have 11 fragments by 5 seconds', function() {
                return expect(this.movie.fragments(5).length).to.be.equal(11);
            });

            describe('fragment', function() {
                before(function() {
                    this.fragment = this.movie.fragments(10)[0];
                });

                describe('#readSamples()', function() {
                    before(function() {
                        this.fragment.readSamples();
                    });

                    it('should read samples data', function() {
                        return this.fragment.samples.map(function(sample) {
                            return expect(sample.buffer.length).to.be.equal(sample.size);
                        });
                    });
                });
            });
        });
    });

});
