'use strict';

var util = require('util');
var MediaUtil = require('../media-util');
var ContainerAtom = require('../container-atom');

function AtomMINF() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [MediaUtil.ATOM_VMHD, MediaUtil.ATOM_SMHD, MediaUtil.ATOM_DINF, MediaUtil.ATOM_STBL];
}

util.inherits(AtomMINF, ContainerAtom);

module.exports = AtomMINF;
