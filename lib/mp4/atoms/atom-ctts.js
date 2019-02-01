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
        let entryCount = buffer.readUInt32BE(4);
        this.entries = new Array(2 * entryCount);
        for (let i = 0, l = this.entries.length; i < l; i++) {
            this.entries[i] = buffer.readUInt32BE(8 + 4 * i);
        }
    }

}

module.exports = AtomCTTS;
