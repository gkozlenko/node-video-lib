'use strict';

const Fragment = require('./fragment');
const AudioSample = require('./audio-sample');
const VideoSample = require('./video-sample');

const TYPE_AUDIO = 0;
const TYPE_VIDEO = 1;

class FragmentList extends Array {

    constructor() {
        super();

        this.fragmentDuration = null;
        this.duration = null;
        this.timescale = null;
        this.size = null;
        this.width = null;
        this.height = null;
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

    bandwidth() {
        let duration = this.relativeDuration();
        return duration > 0 ? 8 * (this.size || 0) / duration : 0;
    }

    resolution() {
        if (this.width !== null && this.height !== null) {
            return `${this.width}x${this.height}`
        }
        return '';
    }

}

module.exports = FragmentList;
