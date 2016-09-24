'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTSC() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomSTSC, Atom);

module.exports = AtomSTSC;
