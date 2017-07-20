'use strict';

const VideoLib = require('../index');

const chai = require('chai');
const faker = require('faker');
const expect = chai.expect;

const shouldHaveRelativeTimestamp = function () {
    describe('#relativeTimestamp()', function () {
        it('should return right relative timestamp value', function () {
            this.record.timestamp = faker.random.number();
            this.record.timescale = faker.random.number();
            expect(this.record.relativeTimestamp()).to.be.equal(this.record.timestamp / this.record.timescale);
        });
        it('should return timestamp if timescale is not set', function () {
            this.record.timestamp = faker.random.number();
            expect(this.record.relativeTimestamp()).to.be.equal(this.record.timestamp);
        });
    });
};

const shouldHaveRelativeDuration = function () {
    describe('#relativeDuration()', function () {
        it('should return right relative duration value', function () {
            this.record.duration = faker.random.number();
            this.record.timescale = faker.random.number();
            expect(this.record.relativeDuration()).to.be.equal(this.record.duration / this.record.timescale);
        });
        it('should return duration if timescale is not set', function () {
            this.record.duration = faker.random.number();
            expect(this.record.relativeDuration()).to.be.equal(this.record.duration);
        });
    });
};

const shouldHaveResolution = function () {
    describe('#resolution()', function () {
        it('should return right resolution when width and height are set', function () {
            this.record.width = faker.random.number();
            this.record.height = faker.random.number();
            expect(this.record.resolution()).to.be.eq(`${this.record.width}x${this.record.height}`);
        });
        it('should return empty string when width is not set', function () {
            this.record.height = faker.random.number();
            expect(this.record.resolution()).to.be.eq('');
        });
        it('should return empty string when height is not set', function () {
            this.record.width = faker.random.number();
            expect(this.record.resolution()).to.be.eq('');
        });
        it('should return empty string when width and height are not set', function () {
            expect(this.record.resolution()).to.be.eq('');
        });
    });
};

describe('Sample', function () {
    beforeEach(function () {
        this.record = new VideoLib.Sample();
    });

    shouldHaveRelativeTimestamp();
});

describe('Track', function () {
    beforeEach(function () {
        this.record = new VideoLib.Track();
    });

    shouldHaveRelativeDuration();
});

describe('VideoTrack', function () {
    beforeEach(function () {
        this.record = new VideoLib.VideoTrack();
    });

    shouldHaveRelativeDuration();
    shouldHaveResolution();
});

describe('AudioTrack', function () {
    beforeEach(function () {
        this.record = new VideoLib.AudioTrack();
    });

    shouldHaveRelativeDuration();
});

describe('Fragment', function () {
    beforeEach(function () {
        this.record = new VideoLib.Fragment();
    });

    shouldHaveRelativeTimestamp();
    shouldHaveRelativeDuration();
});

describe('Movie', function () {
    beforeEach(function () {
        this.record = new VideoLib.Movie();
    });

    shouldHaveRelativeDuration();

    describe('#resolution()', function () {
        it('should return video track resolution when width and height are set', function () {
            let videoTrack = new VideoLib.VideoTrack();
            videoTrack.width = faker.random.number();
            videoTrack.height = faker.random.number();
            this.record.addTrack(videoTrack);
            expect(this.record.resolution()).to.be.eq(videoTrack.resolution());
        });
        it('should return empty string when video track is not set', function () {
            expect(this.record.resolution()).to.be.eq('');
        });
    });

    describe('#videoTrack()', function () {
        it('should return the first video track', function () {
            let videoTrack = new VideoLib.VideoTrack();
            this.record.addTrack(new VideoLib.AudioTrack());
            this.record.addTrack(videoTrack);
            this.record.addTrack(new VideoLib.AudioTrack());
            this.record.addTrack(new VideoLib.VideoTrack());
            expect(this.record.videoTrack()).to.be.equal(videoTrack);
        });
        it('should return null if movie does not have any video tracks', function () {
            this.record.addTrack(new VideoLib.AudioTrack());
            this.record.addTrack(new VideoLib.AudioTrack());
            expect(this.record.videoTrack()).to.be.equal(null);
        });
    });

    describe('#audioTrack()', function () {
        it('should return the first audio track', function () {
            let audioTrack = new VideoLib.AudioTrack();
            this.record.addTrack(new VideoLib.VideoTrack());
            this.record.addTrack(audioTrack);
            this.record.addTrack(new VideoLib.AudioTrack());
            this.record.addTrack(new VideoLib.VideoTrack());
            expect(this.record.audioTrack()).to.be.equal(audioTrack);
        });
        it('should return null if movie does not have any audio tracks', function () {
            this.record.addTrack(new VideoLib.VideoTrack());
            this.record.addTrack(new VideoLib.VideoTrack());
            expect(this.record.audioTrack()).to.be.equal(null);
        });
    });
});

describe('FragmentList', function () {
    beforeEach(function () {
        this.record = new VideoLib.FragmentList();
    });

    shouldHaveRelativeDuration();
});
