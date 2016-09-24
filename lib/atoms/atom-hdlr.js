'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomHDLR() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomHDLR, Atom);

module.exports = AtomHDLR;
