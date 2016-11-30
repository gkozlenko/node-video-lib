'use strict';

const Track = require('./track');
const AudioSample = require('./audio-sample');

class AudioTrack extends Track {

    constructor() {
        super();

        this.channels = null;
        this.sampleRate = null;
        this.sampleSize = null;
    }

    createSample() {
        return new AudioSample();
    }

}

module.exports = AudioTrack;
