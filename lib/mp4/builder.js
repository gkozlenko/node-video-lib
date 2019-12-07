'use strict';

const Movie = require('../movie');
const BuilderImpl = require('./builder-impl');

class Builder {

    /**
     * Build MP4 file
     * @param {Movie} movie
     * @param {(int|Buffer)} source
     * @param {int} fd
     * @returns {boolean}
     */
    static build(movie, source, fd) {
        if (!(movie instanceof Movie)) {
            throw new Error('Argument 1 should be instance of Movie');
        }
        let builder = new BuilderImpl(movie, source, fd);
        return builder.build();
    }

}

module.exports = Builder;
