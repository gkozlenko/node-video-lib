'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSMHD() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomSMHD, Atom);

module.exports = AtomSMHD;
