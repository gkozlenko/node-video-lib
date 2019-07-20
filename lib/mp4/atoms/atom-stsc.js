'use strict';

const SampleTableAtom = require('../sample-table-atom');
const Utils = require('../utils');

class AtomSTSC extends SampleTableAtom {

    type() {
        return Utils.ATOM_STSC;
    }

    countMultiplier() {
        return 3;
    }

}

module.exports = AtomSTSC;
