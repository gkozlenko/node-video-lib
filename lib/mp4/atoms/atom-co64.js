'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomCO64 extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.entries = [];
    }

    parse() {
        let entryCount = this.buffer.readUInt32BE(4);
        this.entries = new Array(entryCount);
        for (let i = 0; i < entryCount; i++) {
            this.entries[i] = Utils.readUInt64BE(this.buffer, 8 + 8 * i);
        }
    }

}

module.exports = AtomCO64;
