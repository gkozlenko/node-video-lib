'use strict';

const MediaHeaderAtom = require('../media-header-atom');
const Utils = require('../utils');

class AtomMDHD extends MediaHeaderAtom {

    type() {
        return Utils.ATOM_MDHD;
    }

}

module.exports = AtomMDHD;
