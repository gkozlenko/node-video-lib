'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

const ATOM_CLASSES = {
    tkhd: require('./atom-tkhd'),
    mdia: require('./atom-mdia'),
};

class AtomTRAK extends ContainerAtom {

    type() {
        return Utils.ATOM_TRAK;
    }

    availableAtomClasses() {
        return ATOM_CLASSES;
    }

}

module.exports = AtomTRAK;
