'use strict';

var util = require('util');
var MediaUtil = require('../media-util');
var ContainerAtom = require('../container-atom');

function AtomSTSD() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.buffer = this.buffer.slice(MediaUtil.HEADER_SIZE);
    this.availableAtoms = [MediaUtil.ATOM_AVC1, MediaUtil.ATOM_MP4A];
}

util.inherits(AtomSTSD, ContainerAtom);

module.exports = AtomSTSD;
