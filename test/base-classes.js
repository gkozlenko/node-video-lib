'use strict';

const VideoLib = require('../index');

const chai = require('chai');
const expect = chai.expect;

const Utils = require('./lib/utils');

const shouldHaveRelativeTimestamp = function () {
    describe('#relativeTimestamp()', function () {
        it('should return right relative timestamp value', function () {
            this.record.timestamp = Utils.randInt();
            this.record.timescale = Utils.randInt();
            expect(this.record.relativeTimestamp()).to.be.equal(this.record.timestamp / this.record.timescale);
        });
        it('should return timestamp if timescale is not set', function () {
            this.record.timestamp = Utils.randInt();
            expect(this.record.relativeTimestamp()).to.be.equal(this.record.timestamp);
        });
    });
};

const shouldHaveRelativeDuration = function () {
    describe('#relativeDuration()', function () {
        it('should return right relative duration value', function () {
            this.record.duration = Utils.randInt();
            this.record.timescale = Utils.randInt();
            expect(this.record.relativeDuration()).to.be.equal(this.record.duration / this.record.timescale);
        });
        it('should return duration if timescale is not set', function () {
            this.record.duration = Utils.randInt();
            expect(this.record.relativeDuration()).to.be.equal(this.record.duration);
        });
    });
};

const shouldHaveResolution = function () {
    describe('#resolution()', function () {
        it('should return right resolution when width and height are set', function () {
            this.record.width = Utils.randInt();
            this.record.height = Utils.randInt();
            expect(this.record.resolution()).to.be.eq(`${this.record.width}x${this.record.height}`);
        });
        it('should return empty string when width is not set', function () {
            this.record.height = Utils.randInt();
            expect(this.record.resolution()).to.be.eq('');
        });
        it('should return empty string when height is not set', function () {
            this.record.width = Utils.randInt();
            expect(this.record.resolution()).to.be.eq('');
        });
        it('should return empty string when width and height are not set', function () {
            expect(this.record.resolution()).to.be.eq('');
        });
    });
};

const shouldHaveEnsureDuration = function () {
    describe('#ensureDuration()', function () {
        it('should return track duration value', function () {
            this.record.duration = Utils.randInt();
            expect(this.record.ensureDuration()).to.be.equal(this.record.duration);
            let sample1 = new VideoLib.Sample();
            sample1.duration = Utils.randInt();
            let sample2 = new VideoLib.Sample();
            sample2.duration = Utils.randInt();
            this.record.samples = [sample1, sample2];
            expect(this.record.ensureDuration()).to.be.equal(this.record.duration);
        });
        it('should set and return max sample duration value', function () {
            expect(this.record.ensureDuration()).to.be.equal(0);
            let sample1 = new VideoLib.Sample();
            sample1.duration = Utils.randInt();
            let sample2 = new VideoLib.Sample();
            sample2.duration = Utils.randInt();
            this.record.samples = [sample1, sample2];
            expect(this.record.ensureDuration()).to.be.equal(Math.max(sample1.duration, sample2.duration));
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
    shouldHaveEnsureDuration();
});

describe('VideoTrack', function () {
    beforeEach(function () {
        this.record = new VideoLib.VideoTrack();
    });

    shouldHaveRelativeDuration();
    shouldHaveEnsureDuration();
    shouldHaveResolution();
});

describe('AudioTrack', function () {
    beforeEach(function () {
        this.record = new VideoLib.AudioTrack();
    });

    shouldHaveRelativeDuration();
    shouldHaveEnsureDuration();
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
            videoTrack.width = Utils.randInt();
            videoTrack.height = Utils.randInt();
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

    describe('#ensureDuration()', function () {
        it('when movie already have duration', function () {
            this.record.duration = Utils.randInt();
            let track = new VideoLib.AudioTrack();
            track.duration = Utils.randInt();
            track.timescale = Utils.randInt();
            this.record.addTrack(track);
            expect(this.record.ensureDuration()).to.be.equal(this.record.duration);
        });

        it('when movie does not have duration and does not have timescale', function () {
            let track = new VideoLib.AudioTrack();
            track.duration = Utils.randInt();
            track.timescale = Utils.randInt();
            this.record.addTrack(track);
            expect(this.record.ensureDuration()).to.be.equal(0);
        });

        it('when movie does not have duration and have one track', function () {
            this.record.timescale = Utils.randInt();
            let track = new VideoLib.AudioTrack();
            track.duration = Utils.randInt();
            track.timescale = Utils.randInt();
            this.record.addTrack(track);
            let expectedDuration = this.record.timescale * track.duration / track.timescale;
            expect(this.record.ensureDuration()).to.be.within(Math.floor(expectedDuration), Math.ceil(expectedDuration));
        });

        it('when movie does not have duration and have two tracks', function () {
            this.record.timescale = Utils.randInt();
            let track1 = new VideoLib.AudioTrack();
            track1.duration = Utils.randInt();
            track1.timescale = Utils.randInt();
            this.record.addTrack(track1);
            let track2 = new VideoLib.VideoTrack();
            track2.duration = Utils.randInt();
            track2.timescale = Utils.randInt();
            this.record.addTrack(track2);
            let track = track1.relativeDuration() > track2.relativeDuration() ? track1 : track2;
            let expectedDuration = this.record.timescale * track.duration / track.timescale;
            expect(this.record.ensureDuration()).to.be.within(Math.floor(expectedDuration), Math.ceil(expectedDuration));
        });
    });
});

describe('FragmentList', function () {
    beforeEach(function () {
        this.record = new VideoLib.FragmentList();
    });

    shouldHaveRelativeDuration();

    describe('#size()', function () {
        it('should return right size value', function () {
            this.record.audio = {
                size: Utils.randInt(),
            };
            this.record.video = {
                size: Utils.randInt(),
            };
            expect(this.record.size()).to.be.equal(this.record.audio.size + this.record.video.size);
        });
    });
});
