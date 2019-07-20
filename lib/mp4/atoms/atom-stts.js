'use strict';

const SampleTableAtom = require('../sample-table-atom');
const Utils = require('../utils');

class AtomSTTS extends SampleTableAtom {

    type() {
        return Utils.ATOM_STTS;
    }

    countMultiplier() {
        return 2;
    }

}

module.exports = AtomSTTS;
