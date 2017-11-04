'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomSTSS extends Atom {

    constructor() {
        super();

        this.entries = [];
    }

    type() {
        return Utils.ATOM_STSS;
    }

    parse(buffer) {
        let entryCount = buffer.readUInt32BE(4);
        this.entries = new Array(entryCount);
        for (let i = 0; i < entryCount; i++) {
            this.entries[i] = buffer.readUInt32BE(8 + 4 * i);
        }
    }

}

module.exports = AtomSTSS;
