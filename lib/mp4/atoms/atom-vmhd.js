'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomVMHD extends Atom {

    type() {
        return Utils.ATOM_VMHD;
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // flags
        buffer.writeUInt32BE(1, offset + 8);
    }

    bufferSize() {
        return 20;
    }

}

module.exports = AtomVMHD;
