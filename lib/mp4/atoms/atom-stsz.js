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
        for (let i = 0; i < entryCount; i++) {
            if (sampleSize === 0) {
                this.entries[i] = buffer.readUInt32BE(12 + 4 * i);
            } else {
                this.entries[i] = sampleSize;
            }
        }
    }

    build() {
        let buffer = new Buffer(12 + 4 * this.entries.length);
        buffer.writeUInt32BE(0, 0);
        buffer.writeUInt32BE(0, 4);
        let entryCount = this.entries.length;
        buffer.writeUInt32BE(entryCount, 8);
        for (let i = 0; i < entryCount; i++) {
            buffer.writeUInt32BE(this.entries[i], 12 + 4 * i);
        }
        return buffer;
    }

}

module.exports = AtomSTSZ;
