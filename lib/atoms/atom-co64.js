'use strict';

var util = require('util');
var Int64 = require('node-int64');
var Atom = require('../atom');

function AtomCO64() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.entries = [];
}

util.inherits(AtomCO64, Atom);

AtomCO64.prototype.parse = function() {
    var entryCount = this.buffer.readUInt32BE(8);
    this.entries = new Array(entryCount);
    for (var i = 0; i < entryCount; i++) {
        this.entries[i] = (new Int64(this.buffer, 12 + 8 * i)).toNumber(true);
    }
};

module.exports = AtomCO64;
