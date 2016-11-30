'use strict';

const Sample = require('./sample');

class VideoSample extends Sample {

    constructor() {
        super();

        this.compositionOffset = null;
        this.keyframe = false;
    }

}

module.exports = VideoSample;
