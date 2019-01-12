'use strict';

const MediaHeaderAtom = require('../media-header-atom');
const Utils = require('../utils');

class AtomMVHD extends MediaHeaderAtom {

    type() {
        return Utils.ATOM_MVHD;
    }

}

module.exports = AtomMVHD;
