'use strict';

var util = require('util');
var AtomUtil = require('../atom-util');
var ContainerAtom = require('../container-atom');

function AtomSTSD() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.buffer = this.buffer.slice(AtomUtil.HEADER_SIZE);
    this.availableAtoms = [AtomUtil.ATOM_AVC1, AtomUtil.ATOM_MP4A];
}

util.inherits(AtomSTSD, ContainerAtom);

module.exports = AtomSTSD;
