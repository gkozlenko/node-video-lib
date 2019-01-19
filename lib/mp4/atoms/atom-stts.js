'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomSTTS extends Atom {

    constructor() {
        super();

        this.entries = [];
    }

    type() {
        return Utils.ATOM_STTS;
    }

    parse(buffer) {
        let entryCount = buffer.readUInt32BE(4);
        this.entries = new Array(2 * entryCount);
        for (let i = 0, l = this.entries.length; i < l; i++) {
            this.entries[i] = buffer.readUInt32BE(8 + 4 * i);
        }
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // entry count
        buffer.writeUInt32BE((this.entries.length / 2) << 0, offset + 12);
        // entries
        for (let i = 0, l = this.entries.length; i < l; i++) {
            buffer.writeUInt32BE(this.entries[i], offset + 16 + 4 * i);
        }
    }

    bufferSize() {
        return 16 + 8 * this.entries.length;
    }

}

module.exports = AtomSTTS;
