'use strict';

const AudioTrack = require('./audio-track');
const VideoTrack = require('./video-track');
const VideoSample = require('./video-sample');
const Fragment = require('./fragment');

const fs = require('fs');

const COMPARE_SAMPLES_THRESHOLD = 0.01;

function compareSamples(sample1, sample2) {
    let timestampDelta = sample1.relativeTimestamp() - sample2.relativeTimestamp();
    if (timestampDelta > -1 * COMPARE_SAMPLES_THRESHOLD && timestampDelta < COMPARE_SAMPLES_THRESHOLD) {
        return sample1.offset - sample2.offset;
    } else {
        return timestampDelta;
    }
}

class Movie {

    constructor(file) {
        this.file = file;
        this.duration = null;
        this.timescale = null;
        this.tracks = [];
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

    bandwidth() {
        let stat = fs.fstatSync(this.file);
        let duration = this.relativeDuration();
        return duration > 0 ? 8 * stat.size / duration : 0;
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
            .sort(compareSamples);
    }

    fragments(fragmentDuration) {
        let fragments = [];
        let timebase = 0;

        let fragment = this._createFragment(0);
        fragments.push(fragment);

        for (let sample of this.samples()) {
            let timestamp = this.timescale * sample.relativeTimestamp();
            let duration = timestamp - timebase;
            fragment.duration = duration;
            if (duration >= this.timescale * fragmentDuration && sample instanceof VideoSample && sample.keyframe) {
                timebase = timestamp;
                fragment = this._createFragment(timestamp);
                fragments.push(fragment);
            }
            fragment.addSample(sample);
        }
        return fragments;
    }

    _createFragment(timestamp) {
        let videoTrack = this.videoTrack();
        let audioTrack = this.audioTrack();

        let fragment = new Fragment(this.file);
        fragment.timestamp = timestamp;
        fragment.timescale = this.timescale;
        if (videoTrack) {
            fragment.videoExtraData = videoTrack.extraData;
        }
        if (audioTrack) {
            fragment.audioExtraData = audioTrack.extraData;
        }
        return fragment;
    }

}

module.exports = Movie;
