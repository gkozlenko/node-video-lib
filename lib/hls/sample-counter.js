'use strict';

const AudioSample = require('../audio-sample');
const VideoSample = require('../video-sample');

class SampleCounter {

    constructor() {
        this._audioCounter = 0;
        this._videoCounter = 0;
    }

    next(sample) {
        let counter = 0;
        if (sample instanceof AudioSample) {
            counter = this._audioCounter;
            this._audioCounter = (this._audioCounter + 1) & 0xf;
        } else if (sample instanceof VideoSample) {
            counter = this._videoCounter;
            this._videoCounter = (this._videoCounter + 1) & 0xf;
        }
        return counter;
    }

}

module.exports = SampleCounter;
