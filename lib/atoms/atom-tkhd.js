'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomTKHD() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomTKHD, Atom);

module.exports = AtomTKHD;
