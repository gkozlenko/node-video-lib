'use strict';

const Sample = require('./sample');

class VideoSample extends Sample {

    constructor() {
        super();

        this.compositionOffset = 0;
        this.keyframe = false;
    }

}

module.exports = VideoSample;
