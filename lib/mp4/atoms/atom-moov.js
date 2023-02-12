'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

const ATOM_CLASSES = {
    mvhd: require('./atom-mvhd'),
    trak: require('./atom-trak'),
};

class AtomMOOV extends ContainerAtom {

    type() {
        return Utils.ATOM_MOOV;
    }

    availableAtomClasses() {
        return ATOM_CLASSES;
    }

}

module.exports = AtomMOOV;
