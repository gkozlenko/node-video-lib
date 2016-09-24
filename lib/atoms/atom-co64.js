'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomCO64() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomCO64, Atom);

module.exports = AtomCO64;
