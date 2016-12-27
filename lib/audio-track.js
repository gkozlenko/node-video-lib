'use strict';

const Track = require('./track');

class AudioTrack extends Track {

    constructor() {
        super();

        this.channels = null;
        this.sampleRate = null;
        this.sampleSize = null;
    }

}

module.exports = AudioTrack;
