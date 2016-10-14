'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTSZ() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.entries = [];
}

util.inherits(AtomSTSZ, Atom);

AtomSTSZ.prototype.parse = function() {
    var sampleSize = this.buffer.readUInt32BE(4);
    var entryCount = this.buffer.readUInt32BE(8);
    this.entries = new Array(entryCount);
    for (var i = 0; i < entryCount; i++) {
        if (sampleSize === 0) {
            this.entries[i] = this.buffer.readUInt32BE(12 + 4 * i);
        } else {
            this.entries[i] = sampleSize;
        }
    }
};

module.exports = AtomSTSZ;
