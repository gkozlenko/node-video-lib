'use strict';

const MediaHeaderAtom = require('../media-header-atom');
const Utils = require('../utils');

class AtomMDHD extends MediaHeaderAtom {

    type() {
        return Utils.ATOM_MDHD;
    }

    build() {
        let buffer = Buffer.alloc(24);

        // timescale
        buffer.writeUInt32BE(this.timescale, 12);
        // duration
        buffer.writeUInt32BE(this.duration, 16);

        return buffer;
    }

}

module.exports = AtomMDHD;
