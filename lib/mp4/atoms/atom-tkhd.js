'use strict';

const Atom = require('../atom');
const BufferUtils = require('../../buffer-utils');
const Utils = require('../utils');

class AtomTKHD extends Atom {

    constructor() {
        super();

        this.duration = null;
    }

    type() {
        return Utils.ATOM_TKHD;
    }

    parse(buffer) {
        if (buffer[0] === 1) {
            this.duration = BufferUtils.readUInt64BE(buffer, 28);
        } else {
            this.duration = buffer.readUInt32BE(20);
        }
    }
}

module.exports = AtomTKHD;
