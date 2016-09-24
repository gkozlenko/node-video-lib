'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomMP4A() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomMP4A, Atom);

module.exports = AtomMP4A;
