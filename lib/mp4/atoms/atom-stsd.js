'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomSTSD extends ContainerAtom {

    availableAtoms() {
        return [Utils.ATOM_AVC1, Utils.ATOM_MP4A];
    }

    type() {
        return Utils.ATOM_STSD;
    }

    parse(buffer) {
        super.parse(buffer.slice(8));
    }

}

module.exports = AtomSTSD;
