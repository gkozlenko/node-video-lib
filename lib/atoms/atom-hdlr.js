'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomHDLR() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.handlerType = null;
}

util.inherits(AtomHDLR, Atom);

AtomHDLR.prototype.parse = function() {
    this.handlerType = this.buffer.toString('ascii', 8, 12);
};

module.exports = AtomHDLR;
