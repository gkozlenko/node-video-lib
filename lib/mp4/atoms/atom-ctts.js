'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomCTTS extends Atom {

    constructor() {
        super();

        this.entries = [];
    }

    type() {
        return Utils.ATOM_CTTS;
    }

    parse(buffer) {
        let entryCount = buffer.readUInt32BE(4);
        this.entries = new Array(2 * entryCount);
        for (let i = 0; i < entryCount; i++) {
            // sample count
            this.entries[2 * i] = buffer.readUInt32BE(8 + 8 * i);
            // sample offset (can be negative)
            this.entries[2 * i + 1] = buffer.readInt32BE(12 + 8 * i);
        }
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // entry count
        let entryCount = (this.entries.length / 2) >> 0;
        buffer.writeUInt32BE(entryCount, offset + 12);
        // entries
        for (let i = 0; i < entryCount; i++) {
            // sample count
            buffer.writeUInt32BE(this.entries[2 * i], offset + 16 + 8 * i);
            // sample offset (can be negative)
            buffer.writeInt32BE(this.entries[2 * i + 1], offset + 20 + 8 * i);
        }
    }

    bufferSize() {
        return 16 + 4 * this.entries.length;
    }

}

module.exports = AtomCTTS;
