'use strict';

const Sample = require('./sample');

class Track {

    constructor() {
        this.duration = null;
        this.timescale = null;
        this.extraData = null;
        this.samples = [];
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

    addSample(sample) {
        this.samples.push(sample);
    }

    createSample() {
        return new Sample();
    }

}

module.exports = Track;
