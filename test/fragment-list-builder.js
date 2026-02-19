'use strict';

const VideoLib = require('../index');
const FragmentListBuilder = VideoLib.FragmentListBuilder;

const Movie = VideoLib.Movie;
const VideoTrack = VideoLib.VideoTrack;
const AudioTrack = VideoLib.AudioTrack;
const VideoSample = VideoLib.VideoSample;
const AudioSample = VideoLib.AudioSample;

const chai = require('chai');
const expect = chai.expect;

const MOVIE_TIMESCALE = 1000;
const VIDEO_TIMESCALE = 12800;
const AUDIO_TIMESCALE = 44100;

describe('FragmentListBuilder', function () {

    describe('#build()', function () {

        beforeEach(function () {
            this.movie = new Movie();
            this.movie.timescale = MOVIE_TIMESCALE;
        });

        const getRelativeTimestamps = (fragment, SampleClass) =>
            fragment.samples
                .filter(s => s instanceof SampleClass)
                .map(s => s.relativeTimestamp());

        it('should not split to chunks when movie without tracks', function () {
            const fragmentDuration = 10;
            const fragmentList = FragmentListBuilder.build(this.movie, fragmentDuration);

            expect(fragmentList.fragmentDuration).to.be.equal(fragmentDuration);
            expect(fragmentList.timescale).to.be.equal(MOVIE_TIMESCALE);
            expect(fragmentList.duration).to.be.equal(0);
            expect(fragmentList.count()).to.be.equal(0);
        });

        describe('when movie has both audio and video tracks', function () {
            beforeEach(function () {
                this.videoTrack = new VideoTrack();
                this.videoTrack.timescale = VIDEO_TIMESCALE;
                this.movie.addTrack(this.videoTrack);

                this.audioTrack = new AudioTrack();
                this.audioTrack.timescale = AUDIO_TIMESCALE;
                this.movie.addTrack(this.audioTrack);
            });

            it('should not split to chunks when movie without samples', function () {
                const fragmentDuration = 10;
                const fragmentList = FragmentListBuilder.build(this.movie, fragmentDuration);

                expect(fragmentList.fragmentDuration).to.be.equal(fragmentDuration);
                expect(fragmentList.timescale).to.be.equal(VIDEO_TIMESCALE);
                expect(fragmentList.duration).to.be.equal(0);
                expect(fragmentList.count()).to.be.equal(0);
            });

            it('should correctly split into chunks when movie has samples', function () {
                const videoSamplesData = [
                    // chunk 1
                    [0, true], [3, true], [5, false],
                    // chunk 2
                    [9, true], [10, false], [11, true], [13, false], [15, false], [17, true], [18, false],
                    // chunk 3
                    [21, true], [23, false],
                ];

                videoSamplesData.forEach(([timestamp, keyframe]) => {
                    const sample = new VideoSample();
                    sample.timescale = VIDEO_TIMESCALE;
                    sample.timestamp = timestamp * VIDEO_TIMESCALE;
                    sample.keyframe = keyframe;
                    this.videoTrack.samples.push(sample);
                });

                for (let i = 0; i < 25; i++) {
                    const sample = new AudioSample();
                    sample.timescale = AUDIO_TIMESCALE;
                    sample.timestamp = i * AUDIO_TIMESCALE;
                    this.audioTrack.samples.push(sample);
                }

                const fragmentDuration = 10;
                const fragmentList = FragmentListBuilder.build(this.movie, fragmentDuration);

                expect(fragmentList.duration).to.be.equal(25 * VIDEO_TIMESCALE);
                expect(fragmentList.count()).to.be.equal(3);

                const expectedFragments = [
                    {
                        duration: 9,
                        video: [0, 3, 5],
                        audio: [0, 1, 2, 3, 4, 5, 6, 7, 8],
                    },
                    {
                        duration: 12,
                        video: [9, 10, 11, 13, 15, 17, 18],
                        audio: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                    },
                    {
                        duration: 4,
                        video: [21, 23],
                        audio: [21, 22, 23, 24],
                    },
                ];

                expectedFragments.forEach((expected, index) => {
                    const fragment = fragmentList.get(index);

                    expect(fragment.relativeDuration())
                        .to.be.equal(expected.duration, `Fragment ${index} duration mismatch`);

                    expect(getRelativeTimestamps(fragment, VideoSample))
                        .to.deep.equal(expected.video, `Fragment ${index} video timestamps mismatch`);

                    expect(getRelativeTimestamps(fragment, AudioSample))
                        .to.deep.equal(expected.audio, `Fragment ${index} audio timestamps mismatch`);
                });
            });
        });

        describe('when movie has only audio track', function () {
            beforeEach(function () {
                this.audioTrack = new AudioTrack();
                this.audioTrack.timescale = AUDIO_TIMESCALE;
                this.movie.addTrack(this.audioTrack);
            });

            it('should not split to chunks when movie without samples', function () {
                const fragmentDuration = 10;
                const fragmentList = FragmentListBuilder.build(this.movie, fragmentDuration);

                expect(fragmentList.fragmentDuration).to.be.equal(fragmentDuration);
                expect(fragmentList.timescale).to.be.equal(AUDIO_TIMESCALE);
                expect(fragmentList.duration).to.be.equal(0);
                expect(fragmentList.count()).to.be.equal(0);
            });

            it('should correctly split into chunks when movie has samples', function () {
                for (let i = 0; i < 25; i++) {
                    const sample = new AudioSample();
                    sample.timescale = AUDIO_TIMESCALE;
                    sample.timestamp = i * AUDIO_TIMESCALE;
                    this.audioTrack.samples.push(sample);
                }

                const fragmentDuration = 10;
                const fragmentList = FragmentListBuilder.build(this.movie, fragmentDuration);

                expect(fragmentList.duration).to.be.equal(25 * AUDIO_TIMESCALE);
                expect(fragmentList.count()).to.be.equal(3);

                const expectedFragments = [
                    {
                        duration: 10,
                        video: [],
                        audio: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    },
                    {
                        duration: 10,
                        video: [],
                        audio: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
                    },
                    {
                        duration: 5,
                        video: [],
                        audio: [20, 21, 22, 23, 24],
                    },
                ];

                expectedFragments.forEach((expected, index) => {
                    const fragment = fragmentList.get(index);

                    expect(fragment.relativeDuration())
                        .to.be.equal(expected.duration, `Fragment ${index} duration mismatch`);

                    expect(getRelativeTimestamps(fragment, VideoSample))
                        .to.deep.equal(expected.video, `Fragment ${index} video timestamps mismatch`);

                    expect(getRelativeTimestamps(fragment, AudioSample))
                        .to.deep.equal(expected.audio, `Fragment ${index} audio timestamps mismatch`);
                });
            });
        });

    });

});
