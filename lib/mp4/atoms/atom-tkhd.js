'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomTKHD extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.duration = null;
    }

    parse() {
        if (this.buffer[0] === 1) {
            this.duration = Utils.readUInt64BE(this.buffer, 28);
        } else {
            this.duration = this.buffer.readUInt32BE(20);
        }
    }
}

module.exports = AtomTKHD;
