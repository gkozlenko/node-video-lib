'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomAVC1 extends Atom {

    constructor() {
        super();

        this.width = null;
        this.height = null;
        this.extraData = null;
    }

    type() {
        return Utils.ATOM_AVC1;
    }

    parse(buffer) {
        let offset = 24;
        this.width = buffer.readUInt16BE(offset);
        offset += 2;
        this.height = buffer.readUInt16BE(offset);
        offset += 52;
        while (offset < buffer.length - 8) {
            let size = buffer.readUInt32BE(offset);
            offset += 4;
            let type = buffer.toString('ascii', offset, offset + 4);
            offset += 4;
            if (size === 0) {
                break;
            }
            if (type === Utils.ATOM_AVCC) {
                this.extraData = buffer.slice(offset);
                break;
            }
            offset += size - 8;
        }
    }

}

module.exports = AtomAVC1;
