'use strict';

const Track = require('./track');
const VideoSample = require('./video-sample');

class VideoTrack extends Track {

    constructor() {
        super();

        this.width = null;
        this.height = null;
    }

    createSample() {
        return new VideoSample();
    }

    resolution() {
        if (this.width !== null && this.height !== null) {
            return `${this.width}x${this.height}`
        }
        return '';
    }

}

module.exports = VideoTrack;
