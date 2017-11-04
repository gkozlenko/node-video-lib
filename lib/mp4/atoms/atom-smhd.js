'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomSMHD extends Atom {

    type() {
        return Utils.ATOM_SMHD;
    }

}

module.exports = AtomSMHD;
