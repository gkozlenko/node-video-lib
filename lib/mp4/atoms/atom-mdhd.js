'use strict';

const Atom = require('../atom');
const BufferUtils = require('../../buffer-utils');
const Utils = require('../utils');

class AtomMDHD extends Atom {

    constructor() {
        super();

        this.timescale = null;
        this.duration = null;
    }

    type() {
        return Utils.ATOM_MDHD;
    }

    parse(buffer) {
        if (buffer[0] === 1) {
            this.timescale = buffer.readUInt32BE(20);
            this.duration = BufferUtils.readInt64BE(buffer, 24);
        } else {
            this.timescale = buffer.readUInt32BE(12);
            this.duration = buffer.readUInt32BE(16);
        }

    }

}

module.exports = AtomMDHD;
