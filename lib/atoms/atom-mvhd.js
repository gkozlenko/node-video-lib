'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomMVHD() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomMVHD, Atom);

module.exports = AtomMVHD;
