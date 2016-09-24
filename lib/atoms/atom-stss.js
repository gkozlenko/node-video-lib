'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTSS() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomSTSS, Atom);

module.exports = AtomSTSS;
