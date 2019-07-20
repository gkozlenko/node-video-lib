'use strict';

const SampleTableAtom = require('../sample-table-atom');
const Utils = require('../utils');

class AtomSTCO extends SampleTableAtom {

    type() {
        return Utils.ATOM_STCO;
    }

}

module.exports = AtomSTCO;
