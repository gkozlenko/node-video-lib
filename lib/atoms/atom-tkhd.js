'use strict';

var util = require('util');
var Atom = require('../atom');
var AtomUtil = require('../atom-util');

function AtomTKHD() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.duration = null;
}

util.inherits(AtomTKHD, Atom);

AtomTKHD.prototype.parse = function() {
    var version = this.buffer[0];
    if (version === 1) {
        this.duration = AtomUtil.readUInt64BE(this.buffer, 28);
    } else {
        this.duration = this.buffer.readUInt32BE(20);
    }
};

module.exports = AtomTKHD;
