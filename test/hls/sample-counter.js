'use strict';

const SampleCounter = require('../../lib/hls/sample-counter');

const chai = require('chai');
const expect = chai.expect;

const VIDEO_PID = 0x100;
const AUDIO_PID = 0x101;

describe('SampleCounter', function () {
    before(function () {
        this.counter = new SampleCounter();
    });

    describe('#next()', function () {
        it('should return a right sequence for different sample types', function () {
            for (let i = 0; i < 5; i++) {
                expect(this.counter.next(AUDIO_PID)).to.be.equal(i);
            }
            for (let i = 0; i < 512; i++) {
                expect(this.counter.next(AUDIO_PID)).to.be.equal((i + 5) % 16);
                expect(this.counter.next(VIDEO_PID)).to.be.equal(i % 16);
            }
        });
    });

});
