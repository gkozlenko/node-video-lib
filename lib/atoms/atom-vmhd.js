'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomVMHD() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomVMHD, Atom);

module.exports = AtomVMHD;
