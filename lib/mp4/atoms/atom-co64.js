'use strict';

const Atom = require('../atom');
const BufferUtils = require('../../buffer-utils');
const Utils = require('../utils');

class AtomCO64 extends Atom {

    constructor() {
        super();

        this.entries = [];
    }

    type() {
        return Utils.ATOM_CO64;
    }

    parse(buffer) {
        let entryCount = buffer.readUInt32BE(4);
        this.entries = new Array(entryCount);
        for (let i = 0; i < entryCount; i++) {
            this.entries[i] = BufferUtils.readInt64BE(buffer, 8 + 8 * i);
        }
    }

    build() {
        let buffer = new Buffer(8 + 8 * this.entries.length);
        buffer.writeUInt32BE(0, 0);
        let entryCount = this.entries.length;
        buffer.writeUInt32BE(entryCount, 4);
        for (let i = 0; i < entryCount; i++) {
            BufferUtils.writeInt64BE(buffer, this.entries[i], 8 + 8 * i);
        }
        return buffer;
    }

}

module.exports = AtomCO64;
