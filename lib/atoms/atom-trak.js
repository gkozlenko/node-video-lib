'use strict';

var util = require('util');
var MediaUtil = require('../media-util');
var ContainerAtom = require('../container-atom');

function AtomTRAK() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [MediaUtil.ATOM_TKHD, MediaUtil.ATOM_MDIA];
}

util.inherits(AtomTRAK, ContainerAtom);

module.exports = AtomTRAK;
