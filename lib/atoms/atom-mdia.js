'use strict';

var util = require('util');
var AtomUtil = require('../atom-util');
var ContainerAtom = require('../container-atom');

function AtomMDIA() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [];
}

util.inherits(AtomMDIA, ContainerAtom);

module.exports = AtomMDIA;
