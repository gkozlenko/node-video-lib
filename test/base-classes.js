'use strict';

const VideoLib = require('../index');

const chai = require('chai');
const faker = require('faker');
const expect = chai.expect;

const shouldHaveRelativeTimestamp = function() {
    describe('#relativeTimestamp()', function() {
        it('should return right relative timestamp value', function() {
            this.record.timestamp = faker.random.number();
            this.record.timescale = faker.random.number();
            expect(this.record.relativeTimestamp()).to.be.equal(this.record.timestamp / this.record.timescale);
        });
        it('should return timestamp if timescale is not set', function() {
            this.record.timestamp = faker.random.number();
            expect(this.record.relativeTimestamp()).to.be.equal(this.record.timestamp);
        });
    });
};

const shouldHaveRelativeDuration = function() {
    describe('#relativeDuration()', function() {
        it('should return right relative duration value', function() {
            this.record.duration = faker.random.number();
            this.record.timescale = faker.random.number();
            expect(this.record.relativeDuration()).to.be.equal(this.record.duration / this.record.timescale);
        });
        it('should return duration if timescale is not set', function() {
            this.record.duration = faker.random.number();
            expect(this.record.relativeDuration()).to.be.equal(this.record.duration);
        });
    });
};

describe('Sample', function() {
    beforeEach(function() {
        this.record = new VideoLib.Sample();
    });

    shouldHaveRelativeTimestamp();
});

describe('Track', function() {
    beforeEach(function() {
        this.record = new VideoLib.Track();
    });

    shouldHaveRelativeDuration();

    describe('#createSample()', function() {
        it('should return a general sample', function() {
            expect(this.record.createSample()).to.be.instanceof(VideoLib.Sample);
        });
    });
});

describe('VideoTrack', function() {
    beforeEach(function() {
        this.record = new VideoLib.VideoTrack();
    });

    shouldHaveRelativeDuration();

    describe('#createSample()', function() {
        it('should return a video sample', function() {
            expect(this.record.createSample()).to.be.instanceof(VideoLib.VideoSample);
        });
    });
});

describe('AudioTrack', function() {
    beforeEach(function() {
        this.record = new VideoLib.AudioTrack();
    });

    shouldHaveRelativeDuration();

    describe('#createSample()', function() {
        it('should return a video sample', function() {
            expect(this.record.createSample()).to.be.instanceof(VideoLib.AudioSample);
        });
    });
});

describe('Fragment', function() {
    beforeEach(function() {
        this.record = new VideoLib.Fragment();
    });

    shouldHaveRelativeTimestamp();
    shouldHaveRelativeDuration();
});

describe('Movie', function() {
    beforeEach(function() {
        this.record = new VideoLib.Movie();
    });

    shouldHaveRelativeDuration();

    describe('#videoTrack()', function() {
        it('should return the first video track', function() {
            let videoTrack = new VideoLib.VideoTrack();
            this.record.addTrack(new VideoLib.AudioTrack());
            this.record.addTrack(videoTrack);
            this.record.addTrack(new VideoLib.AudioTrack());
            this.record.addTrack(new VideoLib.VideoTrack());
            expect(this.record.videoTrack()).to.be.equal(videoTrack);
        });
        it('should return null if movie does not have any video tracks', function() {
            this.record.addTrack(new VideoLib.AudioTrack());
            this.record.addTrack(new VideoLib.AudioTrack());
            expect(this.record.videoTrack()).to.be.equal(null);
        });
    });

    describe('#audioTrack()', function() {
        it('should return the first audio track', function() {
            let audioTrack = new VideoLib.AudioTrack();
            this.record.addTrack(new VideoLib.VideoTrack());
            this.record.addTrack(audioTrack);
            this.record.addTrack(new VideoLib.AudioTrack());
            this.record.addTrack(new VideoLib.VideoTrack());
            expect(this.record.audioTrack()).to.be.equal(audioTrack);
        });
        it('should return null if movie does not have any audio tracks', function() {
            this.record.addTrack(new VideoLib.VideoTrack());
            this.record.addTrack(new VideoLib.VideoTrack());
            expect(this.record.audioTrack()).to.be.equal(null);
        });
    });
});
