'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomMDIA extends ContainerAtom {

    type() {
        return Utils.ATOM_MDIA;
    }

    availableAtoms() {
        return [Utils.ATOM_MDHD, Utils.ATOM_MINF, Utils.ATOM_HDLR];
    }

}

module.exports = AtomMDIA;
