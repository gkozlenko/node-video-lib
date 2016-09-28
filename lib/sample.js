'use strict';

function Sample() {
    this._timescale = null;
    this._timesample = null;
    this._size = null;
    this._offset = null;
}

Sample.prototype.timescale = function(value) {
    if (value === undefined) {
        return this._timescale;
    }
    this._timescale = value;
};

Sample.prototype.timesample = function(value) {
    if (value === undefined) {
        return this._timesample;
    }
    this._timesample = value;
};

Sample.prototype.size = function(value) {
    if (value === undefined) {
        return this._size;
    }
    this._size = value;
};

Sample.prototype.offset = function(value) {
    if (value === undefined) {
        return this._offset;
    }
    this._offset = value;
};

Sample.prototype.timestamp = function() {
    if (this._timescale) {
        return this._timesample / this._timescale;
    } else {
        return this._timesample;
    }
};

module.exports = Sample;
