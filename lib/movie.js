'use strict';

const AudioTrack = require('./audio-track');
const VideoTrack = require('./video-track');
const VideoSample = require('./video-sample');
const Fragment = require('./fragment');
const FragmentList = require('./fragment-list');

const fs = require('fs');

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

    size() {
        let stat = fs.fstatSync(this.file);
        return stat.size;
    }

    bandwidth() {
        let duration = this.relativeDuration();
        return duration > 0 ? 8 * this.size() / duration : 0;
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
        let fragments = new FragmentList();
        fragments.fragmentDuration = fragmentDuration;
        fragments.duration = this.duration;
        fragments.timescale = this.timescale;
        fragments.size = this.size();
        let videoTrack = this.videoTrack();
        if (videoTrack) {
            fragments.width = videoTrack.width;
            fragments.height = videoTrack.height;
            fragments.videoExtraData = videoTrack.extraData;
        }
        let audioTrack = this.audioTrack();
        if (audioTrack) {
            fragments.audioExtraData = audioTrack.extraData;
        }

        let timebase = 0;

        let fragment = this._createFragment(0);
        fragments.push(fragment);

        for (let i = 0, samples = this.samples(), l = samples.length; i < l; i++) {
            let sample = samples[i];
            let timestamp = this.timescale * sample.relativeTimestamp();
            let duration = timestamp - timebase;
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

        let fragment = new Fragment();
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
