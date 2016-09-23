'use strict';

var util = require('util');
var AtomUtil = require('../atom-util');
var ContainerAtom = require('../container-atom');

function AtomMOOV() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [AtomUtil.ATOM_MVHD, AtomUtil.ATOM_TRAK];
}

util.inherits(AtomMOOV, ContainerAtom);

module.exports = AtomMOOV;
