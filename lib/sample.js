'use strict';

var MediaUtil = require('./media-util');

function Sample() {
    this._buffer = null;
    this._timescale = null;
    this._timesample = null;
    this._size = null;
    this._offset = null;
}

MediaUtil.generateMethods(Sample.prototype, ['buffer', 'timescale', 'timesample', 'size', 'offset']);

Sample.prototype.timestamp = function() {
    if (this._timescale) {
        return this._timesample / this._timescale;
    } else {
        return this._timesample;
    }
};

module.exports = Sample;
