'use strict';

const Atom = require('../atom');

class AtomSTCO extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.entries = [];
    }

    parse() {
        let entryCount = this.buffer.readUInt32BE(4);
        this.entries = new Array(entryCount);
        let base = 0;
        for (let i = 0; i < entryCount; i++) {
            let value = this.buffer.readUInt32BE(8 + 4 * i);
            if (i > 0 && value < this.entries[i - 1]) {
                base = this.entries[i - 1];
            }
            this.entries[i] = base + value;
        }
    }

}

module.exports = AtomSTCO;
