'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

function readSize(buffer, offset) {
    let s = 0, i;
    for (i = 0; i < 4; i++) {
        let b = buffer[offset + i] & 0xff;
        s <<= 7;
        s |= b & 0x7f;
        if ((b & 0x80) === 0) {
            break;
        }
    }
    return {
        size: s,
        read: i + 1,
    };
}

class AtomESDS extends Atom {

    constructor() {
        super();

        this.extraData = null;
    }

    type() {
        return Utils.ATOM_ESDS;
    }

    parse(buffer) {
        let offset = 5;
        offset += readSize(buffer, offset).read;
        offset += 4;
        offset += readSize(buffer, offset).read;
        offset += 14;
        let extraSize = readSize(buffer, offset);
        offset += extraSize.read;
        if (0 < extraSize.size) {
            this.extraData = Buffer.allocUnsafe(extraSize.size);
            buffer.copy(this.extraData, 0, offset, offset + extraSize.size);
        }
    }

}

module.exports = AtomESDS;
