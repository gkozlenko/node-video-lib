'use strict';

class Track {

    constructor() {
        this.duration = 0;
        this.timescale = 0;
        this.extraData = null;
        this.codec = null;
        this.samples = [];
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

    size() {
        return this.samples.reduce(function (size, sample) {
            return size + sample.size;
        }, 0);
    }

    ensureDuration() {
        if (this.duration === 0) {
            this.duration = this.samples.reduce((duration, sample) => {
                return Math.max(duration, sample.duration);
            }, 0);
        }
        return this.duration;
    }

}

module.exports = Track;
