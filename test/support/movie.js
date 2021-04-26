'use strict';

const VideoLib = require('../../index');
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const FragmentReader = VideoLib.FragmentReader;

const fs = require('fs');
const chai = require('chai');
const faker = require('faker');
const expect = chai.expect;

const shouldBeValidMovie = function (fileName, videoCodec, audioCodec) {
    it('should be instance of VideoLib.Movie', function () {
        return expect(this.movie).to.be.instanceof(VideoLib.Movie);
    });

    it('should have right relative duration value', function () {
        return expect(this.movie.relativeDuration()).to.be.within(61, 62);
    });

    it('should have two tracks', function () {
        return expect(this.movie.tracks.length).to.be.equal(2);
    });

    it('should have samples', function () {
        return expect(this.movie.samples().length).to.be.ok;
    });

    it('should have right number of samples', function () {
        return expect(this.movie.samples().length).to.be.equal(this.movie.videoTrack().samples.length + this.movie.audioTrack().samples.length);
    });

    it('should have right samples size', function () {
        let size = this.movie.samples().reduce(function (size, sample) {
            return size + sample.size;
        }, 0);
        return [
            expect(fs.statSync(fileName).size).to.be.above(size),
            expect(this.movie.size()).to.eq(size),
        ];
    });

    describe('#videoTrack()', function () {
        before(function () {
            this.videoTrack = this.movie.videoTrack();
        });

        it('should be present', function () {
            return expect(this.videoTrack).to.be.ok;
        });

        it('should have right width', function () {
            return expect(this.videoTrack.width).to.be.equal(1280);
        });

        it('should have right height', function () {
            return expect(this.videoTrack.height).to.be.equal(720);
        });

        it('should have right relative duration value', function () {
            return expect(this.videoTrack.relativeDuration()).to.be.within(61, 62);
        });

        it('should have extraData', function () {
            return expect(this.videoTrack.extraData).to.be.ok;
        });

        it('should have codec', function () {
            return expect(this.videoTrack.codec).to.be.equal(videoCodec);
        });

        it('should have samples', function () {
            return expect(this.videoTrack.samples.length).to.be.ok;
        });

        it('should have right samples size', function () {
            let size = this.videoTrack.samples.reduce(function (size, sample) {
                return size + sample.size;
            }, 0);
            return expect(this.videoTrack.size()).to.eq(size);
        });
    });

    describe('#audioTrack()', function () {
        before(function () {
            this.audioTrack = this.movie.audioTrack();
        });

        it('should be present', function () {
            return expect(this.audioTrack).to.be.ok;
        });

        it('should have right channels', function () {
            return expect(this.audioTrack.channels).to.be.equal(2);
        });

        it('should have right sampleRate', function () {
            return expect(this.audioTrack.sampleRate).to.be.equal(44100);
        });

        it('should have right sampleSize', function () {
            return expect(this.audioTrack.sampleSize).to.be.equal(16);
        });

        it('should have right relative duration value', function () {
            return expect(this.audioTrack.relativeDuration()).to.be.within(61, 62);
        });

        it('should have extraData', function () {
            return expect(this.audioTrack.extraData).to.be.ok;
        });

        it('should have codec', function () {
            return expect(this.audioTrack.codec).to.be.equal(audioCodec);
        });

        it('should have samples', function () {
            return expect(this.audioTrack.samples.length).to.be.ok;
        });

        it('should have right samples size', function () {
            let size = this.audioTrack.samples.reduce(function (size, sample) {
                return size + sample.size;
            }, 0);
            return expect(this.audioTrack.size()).to.eq(size);
        });
    });

    describe('fragments', function () {
        it('should have 6 fragments by 10 seconds', function () {
            return expect(FragmentListBuilder.build(this.movie, 10).count()).to.be.equal(6);
        });

        it('should have 11 fragments by 5 seconds', function () {
            return expect(FragmentListBuilder.build(this.movie, 5).count()).to.be.equal(11);
        });

        describe('fragment', function () {
            before(function () {
                let fragmentList = FragmentListBuilder.build(this.movie, faker.datatype.number({min: 3, max: 10}));
                this.fragment = fragmentList.get(faker.datatype.number({min: 0, max: fragmentList.count() - 1}));
            });

            describe('readSamples', function () {
                before(function () {
                    this.buffers = FragmentReader.readSamples(this.fragment, this.file);
                });

                it('should read samples data', function () {
                    return this.fragment.samples.map((sample, i) => {
                        return expect(this.buffers[i].length).to.be.equal(sample.size);
                    });
                });
            });
        });
    });
};

module.exports = {
    shouldBeValidMovie,
};
