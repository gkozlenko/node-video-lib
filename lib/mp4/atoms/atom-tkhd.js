'use strict';

const Atom = require('../atom');
const BufferUtils = require('../../buffer-utils');

class AtomTKHD extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.duration = null;
    }

    parse() {
        if (this.buffer[0] === 1) {
            this.duration = BufferUtils.readInt64BE(this.buffer, 28);
        } else {
            this.duration = this.buffer.readUInt32BE(20);
        }
    }
}

module.exports = AtomTKHD;
