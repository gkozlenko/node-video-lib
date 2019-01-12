'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomMINF extends ContainerAtom {

    type() {
        return Utils.ATOM_MINF;
    }

    availableAtoms() {
        return [Utils.ATOM_VMHD, Utils.ATOM_SMHD, Utils.ATOM_STBL];
    }

}

module.exports = AtomMINF;
