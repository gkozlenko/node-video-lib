'use strict';

var util = require('util');
var Atom = require('../atom');
var MediaUtil = require('../media-util');

function AtomCO64() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.entries = [];
}

util.inherits(AtomCO64, Atom);

AtomCO64.prototype.parse = function() {
    var entryCount = this.buffer.readUInt32BE(8);
    this.entries = new Array(entryCount);
    for (var i = 0; i < entryCount; i++) {
        this.entries[i] = MediaUtil.readUInt64BE(this.buffer, 12 + 8 * i);
    }
};

module.exports = AtomCO64;
