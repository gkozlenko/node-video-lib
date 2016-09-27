'use strict';

function Sample() {
    this.timescale = null;
    this.timesample = null;
    this.size = null;
    this.offset = null;
}

Sample.prototype.timestamp = function() {
    if (this.timescale > 0) {
        return this.timesample / this.timescale;
    } else {
        return this.timesample;
    }
};

module.exports = Sample;
