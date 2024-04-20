'use strict';

const Atom = require('./atom');

const UINT_MINUS_ONE = -1 >>> 0;

class SampleTableAtom extends Atom {

    constructor() {
        super();

        this.entries = [];
    }

    countMultiplier() {
        return 1;
    }

    parse(buffer) {
        let entryCount = buffer.readUInt32BE(4);
        this.entries = new Array(entryCount * this.countMultiplier());
        for (let i = 0, l = this.entries.length; i < l; i++) {
            this.entries[i] = buffer.readUInt32BE(8 + 4 * i);
            if (this.entries[i] === UINT_MINUS_ONE) {
                this.entries[i] = -1;
            }
        }
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // entry count
        buffer.writeUInt32BE((this.entries.length / this.countMultiplier()) << 0, offset + 12);
        // entries
        for (let i = 0, l = this.entries.length; i < l; i++) {
            let val = this.entries[i];
            if (val === -1) {
                val = UINT_MINUS_ONE;
            }
            buffer.writeUInt32BE(val, offset + 16 + 4 * i);
        }
    }

    bufferSize() {
        return 16 + 4 * this.entries.length;
    }

}

module.exports = SampleTableAtom;
