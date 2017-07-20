'use strict';

class Track {

    constructor() {
        this.duration = 0;
        this.timescale = 0;
        this.extraData = null;
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

}

module.exports = Track;
