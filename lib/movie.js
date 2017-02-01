'use strict';

const AudioTrack = require('./audio-track');
const VideoTrack = require('./video-track');

class Movie {

    constructor() {
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

}

module.exports = Movie;
