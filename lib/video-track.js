'use strict';

const Track = require('./track');

class VideoTrack extends Track {

    constructor() {
        super();

        this.width = null;
        this.height = null;
    }

    resolution() {
        if (this.width !== null && this.height !== null) {
            return `${this.width}x${this.height}`
        }
        return '';
    }

}

module.exports = VideoTrack;
