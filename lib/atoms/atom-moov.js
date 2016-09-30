'use strict';

var util = require('util');
var MediaUtil = require('../media-util');
var ContainerAtom = require('../container-atom');

function AtomMOOV() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [MediaUtil.ATOM_MVHD, MediaUtil.ATOM_TRAK];
}

util.inherits(AtomMOOV, ContainerAtom);

module.exports = AtomMOOV;
