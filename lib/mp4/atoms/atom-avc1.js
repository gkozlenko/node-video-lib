'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomAVC1 extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.width = null;
        this.height = null;
        this.extraData = null;
    }

    parse() {
        let offset = 24;
        this.width = this.buffer.readUInt16BE(offset);
        offset += 2;
        this.height = this.buffer.readUInt16BE(offset);
        offset += 52;
        while (offset < this.buffer.length - 8) {
            let size = this.buffer.readUInt32BE(offset);
            offset += 4;
            let type = this.buffer.toString('ascii', offset, offset + 4);
            offset += 4;
            if (size === 0) {
                break;
            }
            if (type === Utils.ATOM_AVCC) {
                this.extraData = this.buffer.slice(offset);
                break;
            }
            offset += size - 8;
        }
    }

}

module.exports = AtomAVC1;
