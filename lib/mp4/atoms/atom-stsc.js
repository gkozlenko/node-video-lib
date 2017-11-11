'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomSTSC extends Atom {

    constructor() {
        super();

        this.entries = [];
    }

    type() {
        return Utils.ATOM_STSC;
    }

    parse(buffer) {
        let entryCount = buffer.readUInt32BE(4);
        this.entries = new Array(2 * entryCount);
        let pos = 8;
        for (let i = 0, l = this.entries.length; i < l; i++) {
            this.entries[i] = buffer.readUInt32BE(pos);
            pos += i % 2 === 1 ? 8 : 4;
        }
    }

}

module.exports = AtomSTSC;
