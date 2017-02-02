'use strict';

class Sample {

    constructor() {
        this.timestamp = 0;
        this.timescale = 0;
        this.size = 0;
        this.offset = 0;
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
