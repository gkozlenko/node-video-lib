'use strict';

const Atom = require('../atom');
const BufferUtils = require('../../buffer-utils');
const Utils = require('../utils');

class AtomMVHD extends Atom {

    constructor() {
        super();

        this.timescale = null;
        this.duration = null;
    }

    type() {
        return Utils.ATOM_MVHD;
    }

    parse(buffer) {
        if (buffer[0] === 1) {
            this.timescale = buffer.readUInt32BE(20);
            this.duration = BufferUtils.readInt64BE(buffer, 24);
        } else {
            this.timescale = buffer.readUInt32BE(12);
            this.duration = buffer.readUInt32BE(16);
        }
    }

    build() {
        let buffer = new Buffer(100).fill(0);
        // Preferred rate
        buffer.writeUInt16BE(1, 20);
        buffer.writeUInt16BE(0, 22);
        // Preferred volume
        buffer.writeUInt16BE(1, 24);
        // Next track ID
        buffer.writeUInt32BE(1, 96);
        return buffer;
    }

}

module.exports = AtomMVHD;
