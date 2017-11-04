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

    build() {
        let buffer = new Buffer(8 + 8 * this.entries.length);
        buffer.writeUInt32BE(0, 0);
        let entryCount = this.entries.length;
        buffer.writeUInt32BE(entryCount, 4);
        for (let i = 0; i < entryCount; i++) {
            buffer.writeUInt32BE(1, 8 + 8 * i);
            buffer.writeUInt32BE(this.entries[i], 8 + 8 * (i + 1));
        }
        return buffer;
    }

}

module.exports = AtomCTTS;
