'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomSMHD extends Atom {

    type() {
        return Utils.ATOM_SMHD;
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
    }

    bufferSize() {
        return 16;
    }

}

module.exports = AtomSMHD;
