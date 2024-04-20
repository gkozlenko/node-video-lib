'use strict';

const SampleTableAtom = require('../sample-table-atom');
const Utils = require('../utils');

class AtomELST extends SampleTableAtom {

    type() {
        return Utils.ATOM_ELST;
    }

    countMultiplier() {
        return 3;
    }

}

module.exports = AtomELST;
