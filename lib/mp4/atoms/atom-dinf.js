'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomDINF extends Atom {

    type() {
        return Utils.ATOM_DINF;
    }

}

module.exports = AtomDINF;
