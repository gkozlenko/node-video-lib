'use strict';

var util = require('util');
var AtomUtil = require('../atom-util');
var ContainerAtom = require('../container-atom');

function AtomMDIA() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [AtomUtil.ATOM_MDHD, AtomUtil.ATOM_MINF, AtomUtil.ATOM_HDLR];
}

util.inherits(AtomMDIA, ContainerAtom);

module.exports = AtomMDIA;
