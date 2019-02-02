'use strict';

const SampleTableAtom = require('../sample-table-atom');
const Utils = require('../utils');

class AtomSTSS extends SampleTableAtom {

    type() {
        return Utils.ATOM_STSS;
    }

}

module.exports = AtomSTSS;
