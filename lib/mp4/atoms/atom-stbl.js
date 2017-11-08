'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomSTBL extends ContainerAtom {

    type() {
        return Utils.ATOM_STBL;
    }

    availableAtoms() {
        return [
            Utils.ATOM_STSZ, Utils.ATOM_STCO, Utils.ATOM_STSS, Utils.ATOM_STTS,
            Utils.ATOM_STSC, Utils.ATOM_CO64, Utils.ATOM_STSD, Utils.ATOM_CTTS,
        ];
    }

}

module.exports = AtomSTBL;
