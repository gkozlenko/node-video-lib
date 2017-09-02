'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomMDIA extends ContainerAtom {

    availableAtoms() {
        return [Utils.ATOM_MDHD, Utils.ATOM_MINF, Utils.ATOM_HDLR];
    }

    type() {
        return Utils.ATOM_MDIA;
    }

}

module.exports = AtomMDIA;
