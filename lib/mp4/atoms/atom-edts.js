'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

const ATOM_CLASSES = {
    elst: require('./atom-elst'),
};

class AtomEDTS extends ContainerAtom {

    type() {
        return Utils.ATOM_EDTS;
    }

    availableAtomClasses() {
        return ATOM_CLASSES;
    }

}

module.exports = AtomEDTS;
