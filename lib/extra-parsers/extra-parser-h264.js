'use strict';

var ExtraParser = require('./extra-parser');
var util = require('util');

function ExtraParserH264() {
    this._sps = [];
    this._spsLength = 0;
    this._pps = [];
    this._ppsLength = 0;

    ExtraParser.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(ExtraParserH264, ExtraParser);

ExtraParserH264.prototype._parse = function() {
    var pos = 5;
    var spsFlags = this._extraData[pos++];
    var i, length, unit;
    var spsCount = spsFlags & 0x1f;
    for (i = 0; i < spsCount; i++) {
        length = this._extraData.readUInt16BE(pos);
        pos += 2;
        unit = new Buffer(this._extraData, pos, length);
        pos += length;
        this._sps.push(unit);
        this._spsLength += length;
    }
    var ppsCount = this._extraData[pos++];
    for (i = 0; i < ppsCount; i++) {
        length = this._extraData.readUInt16BE(pos);
        pos += 2;
        unit = new Buffer(this._extraData, pos, length);
        pos += length;
        this._pps.push(unit);
        this._ppsLength += length;
    }
};

ExtraParserH264.prototype.sps = function() {
    return this._sps;
};

ExtraParserH264.prototype.spsLength = function() {
    return this._spsLength;
};

ExtraParserH264.prototype.pps = function() {
    return this._pps;
};

ExtraParserH264.prototype.ppsLength = function() {
    return this._ppsLength;
};

module.exports = ExtraParserH264;
