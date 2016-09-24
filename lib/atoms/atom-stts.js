'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTTS() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomSTTS, Atom);

module.exports = AtomSTTS;
