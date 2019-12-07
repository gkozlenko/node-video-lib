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
            this.entries[i] = BufferUtils.readUInt64BE(buffer, 8 + 8 * i);
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
            BufferUtils.writeUInt64BE(buffer, this.entries[i], offset + 16 + 8 * i);
        }
    }

    bufferSize() {
        return 16 + 8 * this.entries.length;
    }

}

module.exports = AtomCO64;
