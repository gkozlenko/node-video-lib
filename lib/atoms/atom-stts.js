'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTTS() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.entries = [];
}

util.inherits(AtomSTTS, Atom);

AtomSTTS.prototype.parse = function() {
    var entryCount = this.buffer.readUInt32BE(4);
    this.entries = new Array(2 * entryCount);
    for (var i = 0, l = this.entries.length; i < l; i++) {
        this.entries[i] = this.buffer.readUInt32BE(8 + 4 * i);
    }
};

module.exports = AtomSTTS;
