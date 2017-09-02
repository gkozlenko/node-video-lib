'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomMINF extends ContainerAtom {

    availableAtoms() {
        return [Utils.ATOM_VMHD, Utils.ATOM_SMHD, Utils.ATOM_DINF, Utils.ATOM_STBL];
    }

    type() {
        return Utils.ATOM_MINF;
    }

}

module.exports = AtomMINF;
