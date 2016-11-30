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

}

module.exports = VideoTrack;
