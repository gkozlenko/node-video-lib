'use strict';

const Atom = require('../atom');

class AtomSTSS extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.entries = [];
    }

    parse() {
        let entryCount = this.buffer.readUInt32BE(4);
        this.entries = new Array(entryCount);
        for (let i = 0; i < entryCount; i++) {
            this.entries[i] = this.buffer.readUInt32BE(8 + 4 * i);
        }
    }

}

module.exports = AtomSTSS;
