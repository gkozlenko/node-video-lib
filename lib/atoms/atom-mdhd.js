'use strict';

var util = require('util');
var Int64 = require('node-int64');
var Atom = require('../atom');

function AtomMDHD() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.timescale = null;
    this.duration = null;
}

util.inherits(AtomMDHD, Atom);

AtomMDHD.prototype.parse = function() {
    var version = this.buffer[0];
    if (version === 1) {
        this.timescale = this.buffer.readUInt32BE(20);
        this.duration = (new Int64(this.buffer, 24)).toNumber(true);
    } else {
        this.timescale = this.buffer.readUInt32BE(12);
        this.duration = this.buffer.readUInt32BE(16);
    }
};

module.exports = AtomMDHD;
