'use strict';

const Atom = require('./atom');

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
            buffer.writeUInt32BE(this.entries[i], offset + 16 + 4 * i);
        }
    }

    bufferSize() {
        return 16 + 4 * this.entries.length;
    }

}

module.exports = SampleTableAtom;
