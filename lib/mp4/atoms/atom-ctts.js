'use strict';

const SampleTableAtom = require('../sample-table-atom');
const Utils = require('../utils');

class AtomCTTS extends SampleTableAtom {

    type() {
        return Utils.ATOM_CTTS;
    }

    countMultiplier() {
        return 2;
    }

}

module.exports = AtomCTTS;
