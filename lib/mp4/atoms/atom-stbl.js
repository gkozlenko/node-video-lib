'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

const ATOM_CLASSES = {
    stsz: require('./atom-stsz'),
    stco: require('./atom-stco'),
    stss: require('./atom-stss'),
    stts: require('./atom-stts'),
    stsc: require('./atom-stsc'),
    co64: require('./atom-co64'),
    stsd: require('./atom-stsd'),
    ctts: require('./atom-ctts'),
};

class AtomSTBL extends ContainerAtom {

    type() {
        return Utils.ATOM_STBL;
    }

    availableAtomClasses() {
        return ATOM_CLASSES;
    }

}

module.exports = AtomSTBL;
