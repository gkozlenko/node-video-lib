'use strict';

var util = require('util');
var AtomUtil = require('../atom-util');
var ContainerAtom = require('../container-atom');

function AtomTRAK() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [AtomUtil.ATOM_TKHD, AtomUtil.ATOM_MDIA];
}

util.inherits(AtomTRAK, ContainerAtom);

module.exports = AtomTRAK;
