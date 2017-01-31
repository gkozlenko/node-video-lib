'use strict';

const AudioTrack = require('./audio-track');
const VideoTrack = require('./video-track');
const VideoSample = require('./video-sample');
const FragmentList = require('./fragment-list');

class Movie {

    constructor(file) {
        this.file = file;
        this.duration = 0;
        this.timescale = 0;
        this.tracks = [];
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

    resolution() {
        let videoTrack = this.videoTrack();
        if (videoTrack !== null) {
            return videoTrack.resolution();
        }
        return '';
    }

    addTrack(track) {
        this.tracks.push(track);
    }

    videoTrack() {
        for (let track of this.tracks) {
            if (track instanceof VideoTrack) {
                return track;
            }
        }
        return null;
    }

    audioTrack() {
        for (let track of this.tracks) {
            if (track instanceof AudioTrack) {
                return track;
            }
        }
        return null;
    }

    samples() {
        return [this.videoTrack(), this.audioTrack()]
            .filter(track => track !== null)
            .map(track => track.samples)
            .reduce((a, b) => a.concat(b), [])
            .sort((sample1, sample2) => {
                let timestampDiff = 0;
                if (sample1.timescale === sample2.timescale) {
                    timestampDiff = sample1.timestamp - sample2.timestamp;
                } else {
                    timestampDiff = sample1.relativeTimestamp() - sample2.relativeTimestamp();
                }
                return timestampDiff || sample1.offset - sample2.offset;
            });
    }

    fragments(fragmentDuration) {
        let fragmentList = new FragmentList();
        fragmentList.fragmentDuration = fragmentDuration;
        fragmentList.duration = this.duration;
        fragmentList.timescale = this.timescale;
        let videoTrack = this.videoTrack();
        if (videoTrack) {
            fragmentList.width = videoTrack.width;
            fragmentList.height = videoTrack.height;
            fragmentList.videoExtraData = videoTrack.extraData;
        }
        let audioTrack = this.audioTrack();
        if (audioTrack) {
            fragmentList.audioExtraData = audioTrack.extraData;
        }

        let timebase = 0;
        let fragment = fragmentList.createFragment(0);

        for (let i = 0, samples = this.samples(), l = samples.length; i < l; i++) {
            let sample = samples[i];
            if (sample instanceof VideoSample) {
                let timestamp = this.timescale * sample.relativeTimestamp();
                let duration = timestamp - timebase;
                fragment.duration = duration;
                if (duration >= this.timescale * fragmentDuration && sample instanceof VideoSample && sample.keyframe) {
                    timebase = timestamp;
                    fragment = fragmentList.createFragment(timestamp);
                }
            }
            fragment.addSample(sample);
        }
        return fragmentList;
    }

}

module.exports = Movie;
