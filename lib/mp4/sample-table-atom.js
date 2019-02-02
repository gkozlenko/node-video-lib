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

}

module.exports = SampleTableAtom;
