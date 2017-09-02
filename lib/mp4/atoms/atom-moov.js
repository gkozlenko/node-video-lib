'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomMOOV extends ContainerAtom {

    availableAtoms() {
        return [Utils.ATOM_MVHD, Utils.ATOM_TRAK];
    }

    type() {
        return Utils.ATOM_MOOV;
    }

}

module.exports = AtomMOOV;
