'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomSTCO extends Atom {

    constructor() {
        super();

        this.entries = [];
    }

    type() {
        return Utils.ATOM_STCO;
    }

    parse(buffer) {
        let entryCount = buffer.readUInt32BE(4);
        this.entries = new Array(entryCount);
        let base = 0;
        for (let i = 0; i < entryCount; i++) {
            let value = buffer.readUInt32BE(8 + 4 * i);
            if (i > 0 && value < this.entries[i - 1]) {
                base = this.entries[i - 1];
            }
            this.entries[i] = base + value;
        }
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // entry count
        buffer.writeUInt32BE(this.entries.length, offset + 12);
        // entries
        for (let i = 0, l = this.entries.length; i < l; i++) {
            buffer.writeUInt32BE(this.entries[i], offset + 16 + 4 * i);
        }
    }

    bufferSize() {
        return 16 + 4 * this.entries.length;
    }

}

module.exports = AtomSTCO;
