'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomTRAK extends ContainerAtom {

    availableAtoms() {
        return [Utils.ATOM_TKHD, Utils.ATOM_MDIA];
    }

    type() {
        return Utils.ATOM_TRAK;
    }

}

module.exports = AtomTRAK;
