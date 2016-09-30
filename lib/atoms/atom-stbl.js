'use strict';

var util = require('util');
var MediaUtil = require('../media-util');
var ContainerAtom = require('../container-atom');

function AtomSTBL() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [
        MediaUtil.ATOM_STSZ, MediaUtil.ATOM_STCO, MediaUtil.ATOM_STSS, MediaUtil.ATOM_STTS,
        MediaUtil.ATOM_STSC, MediaUtil.ATOM_CO64, MediaUtil.ATOM_STSD, MediaUtil.ATOM_CTTS
    ];
}

util.inherits(AtomSTBL, ContainerAtom);

module.exports = AtomSTBL;
