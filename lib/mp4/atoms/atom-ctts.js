'use strict';

const Atom = require('../atom');

class AtomCTTS extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.entries = [];
    }

    parse() {
        let tmpCount = this.buffer.readUInt32BE(4);
        let tmp = new Array(2 * tmpCount);
        let count = 0;
        for (let i = 0, l = 2 * tmpCount; i < l; i++) {
            tmp[i] = this.buffer.readUInt32BE(8 + 4 * i);
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

}

module.exports = AtomCTTS;
