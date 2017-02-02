'use strict';

class Fragment {

    constructor() {
        this.timestamp = 0;
        this.duration = 0;
        this.timescale = 0;
        this.videoExtraData = null;
        this.audioExtraData = null;
        this.samples = [];
    }

    relativeTimestamp() {
        if (this.timescale) {
            return this.timestamp / this.timescale;
        } else {
            return this.timestamp;
        }
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

}

module.exports = Fragment;
