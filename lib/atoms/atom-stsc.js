'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTSC() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.entities = [];
}

util.inherits(AtomSTSC, Atom);

AtomSTSC.prototype.parse = function() {
    var entryCount = this.buffer.readUInt32BE(4);
    this.entries = new Array(3 * entryCount);
    for (var i = 0, l = this.entries.length; i < l; i++) {
        this.entries[i] = this.buffer.readUInt32BE(8 + 4 * i);
    }
};

module.exports = AtomSTSC;
