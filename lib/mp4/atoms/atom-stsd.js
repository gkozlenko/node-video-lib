'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomSTSD extends ContainerAtom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.buffer = this.buffer.slice(8);
    }

    availableAtoms() {
        return [Utils.ATOM_AVC1, Utils.ATOM_MP4A];
    }

}

module.exports = AtomSTSD;
