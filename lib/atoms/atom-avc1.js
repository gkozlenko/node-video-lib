'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomAVC1() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomAVC1, Atom);

module.exports = AtomAVC1;
