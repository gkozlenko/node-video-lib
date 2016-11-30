'use strict';

class Sample {

    constructor() {
        this.buffer = null;
        this.timestamp = null;
        this.timescale = null;
        this.size = null;
        this.offset = null;
    }

    relativeTimestamp() {
        if (this.timescale) {
            return this.timestamp / this.timescale;
        } else {
            return this.timestamp;
        }
    }

}

module.exports = Sample;
