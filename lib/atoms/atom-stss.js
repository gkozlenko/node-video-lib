'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTSS() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.entries = [];
}

util.inherits(AtomSTSS, Atom);

AtomSTSS.prototype.parse = function() {
    var entryCount = this.buffer.readUInt32BE(4);
    this.entries = new Array(entryCount);
    for (var i = 0; i < entryCount; i++) {
        this.entries[i] = this.buffer.readUInt32BE(8 + 4 * i);
    }
};

module.exports = AtomSTSS;
