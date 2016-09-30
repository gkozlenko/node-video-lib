'use strict';

var util = require('util');
var MediaUtil = require('../media-util');
var ContainerAtom = require('../container-atom');

function AtomMDIA() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [MediaUtil.ATOM_MDHD, MediaUtil.ATOM_MINF, MediaUtil.ATOM_HDLR];
}

util.inherits(AtomMDIA, ContainerAtom);

module.exports = AtomMDIA;
