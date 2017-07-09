'use strict';

const Atom = require('../atom');
const BufferUtils = require('../../buffer-utils');

class AtomMDHD extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.timescale = null;
        this.duration = null;
    }

    parse() {
        if (this.buffer[0] === 1) {
            this.timescale = this.buffer.readUInt32BE(20);
            this.duration = BufferUtils.readInt64BE(this.buffer, 24);
        } else {
            this.timescale = this.buffer.readUInt32BE(12);
            this.duration = this.buffer.readUInt32BE(16);
        }

    }

}

module.exports = AtomMDHD;
