'use strict';

var util = require('util');
var ExtraParser = require('./extra-parser');

function ExtraParserH264() {
    this._pos = 0;
    this._sps = [];
    this._pps = [];

    ExtraParser.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(ExtraParserH264, ExtraParser);

ExtraParserH264.prototype._parse = function() {
    this._pos = 5;
    var spsFlags = this._extraData[this._pos++];
    var i, unit;
    var spsCount = spsFlags & 0x1f;
    for (i = 0; i < spsCount; i++) {
        this._sps.push(this._readNalUnit());
    }
    var ppsCount = this._extraData[this._pos++];
    for (i = 0; i < ppsCount; i++) {
        this._pps.push(this._readNalUnit());
    }
};

ExtraParserH264.prototype.sps = function() {
    return this._sps;
};

ExtraParserH264.prototype.pps = function() {
    return this._pps;
};

ExtraParserH264.prototype._readNalUnit = function() {
    var length = this._extraData.readUInt16BE(this._pos);
    this._pos += 2;
    var unit = new Buffer(length);
    this._extraData.copy(unit, 0, this._pos, this._pos + length);
    this._pos += length;
    return unit;
};

module.exports = ExtraParserH264;
