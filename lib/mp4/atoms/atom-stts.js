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

    build() {
        let buffer = new Buffer(8 + 4 * this.entries.length);
        buffer.writeUInt32BE(0, 0);
        let entryCount = this.entries.length;
        buffer.writeUInt32BE(entryCount / 2, 4);
        for (let i = 0; i < entryCount; i++) {
            buffer.writeUInt32BE(this.entries[i], 8 + 4 * i);
        }
        return buffer;
    }

}

module.exports = AtomSTTS;
