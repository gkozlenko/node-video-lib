'use strict';

const Atom = require('../atom');

class AtomSTSZ extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.entries = [];
    }

    parse() {
        let sampleSize = this.buffer.readUInt32BE(4);
        let entryCount = this.buffer.readUInt32BE(8);
        this.entries = new Array(entryCount);
        for (let i = 0; i < entryCount; i++) {
            if (sampleSize === 0) {
                this.entries[i] = this.buffer.readUInt32BE(12 + 4 * i);
            } else {
                this.entries[i] = sampleSize;
            }
        }
    }

}

module.exports = AtomSTSZ;
