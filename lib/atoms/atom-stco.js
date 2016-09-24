'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomSTCO() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomSTCO, Atom);

module.exports = AtomSTCO;
