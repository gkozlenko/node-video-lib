'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTCO() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.entries = [];
}

util.inherits(AtomSTCO, Atom);

AtomSTCO.prototype.parse = function() {
    var entryCount = this.buffer.readUInt32BE(4);
    this.entries = new Array(entryCount);
    var base = 0;
    for (var i = 0; i < entryCount; i++) {
        var value = this.buffer.readUInt32BE(8 + 4 * i);
        if (i > 0 && value < this.entries[i - 1]) {
            base = this.entries[i - 1];
        }
        this.entries[i] = base + value;
    }
};

module.exports = AtomSTCO;
