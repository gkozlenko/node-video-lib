'use strict';

var util = require('util');
var Atom = require('../atom');
var AtomUtil = require('../atom-util');

function AtomMVHD() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.timescale = null;
    this.duration = null;
}

util.inherits(AtomMVHD, Atom);

AtomMVHD.prototype.parse = function() {
    var version = this.buffer[0];
    if (version === 1) {
        this.timescale = this.buffer.readUInt32BE(20);
        this.duration = AtomUtil.readUInt64BE(this.buffer, 24);
    } else {
        this.timescale = this.buffer.readUInt32BE(12);
        this.duration = this.buffer.readUInt32BE(16);
    }
};

module.exports = AtomMVHD;
