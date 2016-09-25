'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomTKHD() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.duration = null;
}

util.inherits(AtomTKHD, Atom);

AtomTKHD.prototype.parse = function() {
    var version = this.buffer[0];
    if (version === 1) {
        this.duration = (new Int64(this.buffer, 28)).toNumber(true);
    } else {
        this.duration = this.buffer.readUInt32BE(20);
    }
};

module.exports = AtomTKHD;
