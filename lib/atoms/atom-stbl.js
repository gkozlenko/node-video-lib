'use strict';

var util = require('util');
var AtomUtil = require('../atom-util');
var ContainerAtom = require('../container-atom');

function AtomSTBL() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [
        AtomUtil.ATOM_STSZ, AtomUtil.ATOM_STCO, AtomUtil.ATOM_STSS, AtomUtil.ATOM_STTS,
        AtomUtil.ATOM_STSC, AtomUtil.ATOM_CO64, AtomUtil.ATOM_STSD, AtomUtil.ATOM_CTTS
    ];
}

util.inherits(AtomSTBL, ContainerAtom);

module.exports = AtomSTBL;
