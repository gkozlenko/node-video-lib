'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomSTSZ extends Atom {

    constructor() {
        super();

        this.entries = [];
    }

    type() {
        return Utils.ATOM_STSZ;
    }

    parse(buffer) {
        let sampleSize = buffer.readUInt32BE(4);
        let entryCount = buffer.readUInt32BE(8);
        this.entries = new Array(entryCount);
        if (sampleSize === 0) {
            for (let i = 0; i < entryCount; i++) {
                this.entries[i] = buffer.readUInt32BE(12 + 4 * i);
            }
        } else {
            this.entries.fill(sampleSize);
        }
    }

}

module.exports = AtomSTSZ;
