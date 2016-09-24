'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomCTTS() {
    Atom.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(AtomCTTS, Atom);

module.exports = AtomCTTS;
