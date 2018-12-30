'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomMOOV extends ContainerAtom {

    type() {
        return Utils.ATOM_MOOV;
    }

    availableAtoms() {
        return [Utils.ATOM_MVHD, Utils.ATOM_TRAK];
    }

}

module.exports = AtomMOOV;
