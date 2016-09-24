'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTSZ() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomSTSZ, Atom);

module.exports = AtomSTSZ;
