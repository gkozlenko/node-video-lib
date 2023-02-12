'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

const ATOM_CLASSES = {
    mdhd: require('./atom-mdhd'),
    minf: require('./atom-minf'),
    hdlr: require('./atom-hdlr'),
};

class AtomMDIA extends ContainerAtom {

    type() {
        return Utils.ATOM_MDIA;
    }

    availableAtomClasses() {
        return ATOM_CLASSES;
    }

}

module.exports = AtomMDIA;
