'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomDINF() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomDINF, Atom);

module.exports = AtomDINF;
