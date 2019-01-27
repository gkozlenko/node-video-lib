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
        let tmpCount = buffer.readUInt32BE(4);
        let tmp = new Array(2 * tmpCount);
        let count = 0;
        for (let i = 0, l = 2 * tmpCount; i < l; i++) {
            tmp[i] = buffer.readUInt32BE(8 + 4 * i);
            if (!(i % 2)) {
                count += tmp[i];
            }
        }
        let pos = 0;
        this.entries = new Array(count);
        for (let i = 0, l = tmp.length; i < l; i += 2) {
            for (let j = 0; j < tmp[i]; j++) {
                this.entries[pos++] = tmp[i + 1];
            }
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
        return 16 + 4 * this.entries.length;
    }

}

module.exports = AtomCTTS;
