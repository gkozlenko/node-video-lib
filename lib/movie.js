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

    size() {
        return this.tracks.reduce(function (size, track) {
            return size + track.size();
        }, 0);
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
            .sort((a, b) => {
                if (a.timescale === b.timescale) {
                    return a.timestamp - b.timestamp;
                } else {
                    return a.timestamp * b.timescale - b.timestamp * a.timescale;
                }
            });
    }

    ensureDuration() {
        if (this.duration === 0) {
            this.duration = this.tracks.reduce((duration, track) => {
                return Math.max(duration, this.timescale * track.relativeDuration());
            }, 0);
        }
        return this.duration;
    }

}

module.exports = Movie;
