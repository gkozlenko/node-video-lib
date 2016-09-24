'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomMDHD() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomMDHD, Atom);

module.exports = AtomMDHD;
