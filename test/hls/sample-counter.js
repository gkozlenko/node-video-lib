'use strict';

const SampleCounter = require('../../lib/hls/sample-counter');
const AudioSample = require('../../lib/audio-sample');
const VideoSample = require('../../lib/video-sample');

const chai = require('chai');
const expect = chai.expect;

describe('SampleCounter', function () {
    before(function () {
        this.counter = new SampleCounter();
        this.audioSample = new AudioSample();
        this.videoSample = new VideoSample();
    });

    describe('#next()', function () {
        it('should return a right sequence for different sample types', function () {
            for (let i = 0; i < 5; i++) {
                expect(this.counter.next(this.audioSample)).to.be.equal(i);
            }
            for (let i = 0; i < 512; i++) {
                expect(this.counter.next(this.audioSample)).to.be.equal((i + 5) % 16);
                expect(this.counter.next(this.videoSample)).to.be.equal(i % 16);
            }
        });
    });

});
