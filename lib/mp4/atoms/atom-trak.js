'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomTRAK extends ContainerAtom {

    type() {
        return Utils.ATOM_TRAK;
    }

    availableAtoms() {
        return [Utils.ATOM_TKHD, Utils.ATOM_MDIA];
    }

}

module.exports = AtomTRAK;
