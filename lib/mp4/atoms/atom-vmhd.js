'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomVMHD extends Atom {

    type() {
        return Utils.ATOM_VMHD;
    }

}

module.exports = AtomVMHD;
