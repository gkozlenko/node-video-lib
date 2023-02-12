'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

const ATOM_CLASSES = {
    vmhd: require('./atom-vmhd'),
    smhd: require('./atom-smhd'),
    stbl: require('./atom-stbl'),
};

class AtomMINF extends ContainerAtom {

    type() {
        return Utils.ATOM_MINF;
    }

    availableAtomClasses() {
        return ATOM_CLASSES;
    }

}

module.exports = AtomMINF;
