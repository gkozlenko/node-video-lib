'use strict';

const Track = require('./track');

class VideoTrack extends Track {

    constructor() {
        super();

        this.width = 0;
        this.height = 0;
    }

    resolution() {
        if (this.width && this.height) {
            return `${this.width}x${this.height}`;
        }
        return '';
    }

}

module.exports = VideoTrack;
