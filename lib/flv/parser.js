'use strict';

const Movie = require('../movie');
const AudioTrack = require('../audio-track');
const VideoTrack = require('../video-track');
const AudioSample = require('../audio-sample');
const VideoSample = require('../video-sample');
const SourceReader = require('../source-reader');

class Parser {

    /**
     * Parse FLV file
     * @param {(int|Buffer)} source
     * @returns {Movie}
     */
    static parse(source) {
        // Create movie
        let movie = new Movie();

        // Return movie object
        return movie;
    }

}

module.exports = Parser;
