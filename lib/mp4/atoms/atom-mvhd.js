'use strict';

const Atom = require('../atom');
const Utils = require('../utils');
const BufferUtils = require('../../buffer-utils');

const MATRIX = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000];

class AtomMVHD extends Atom {

    constructor() {
        super();

        this.timescale = null;
        this.duration = null;
        this.nextTrackId = null;
    }

    type() {
        return Utils.ATOM_MVHD;
    }

    parse(buffer) {
        let version = buffer[0];
        if (version === 1) {
            this.timescale = buffer.readUInt32BE(20);
            this.duration = BufferUtils.readUInt64BE(buffer, 24);
            this.nextTrackId = buffer.readUInt32BE(104);
        } else {
            this.timescale = buffer.readUInt32BE(12);
            this.duration = buffer.readUInt32BE(16);
            this.nextTrackId = buffer.readUInt32BE(96);
        }
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // timescale
        buffer.writeUInt32BE(this.timescale, offset + 20);
        // duration
        buffer.writeUInt32BE(this.duration, offset + 24);
        // preferred rate
        buffer.writeUInt32BE(0x10000, offset + 28);
        // preferred volume
        buffer.writeUInt16BE(0x100, offset + 32);
        // matrix
        for (let i = 0; i < MATRIX.length; i++) {
            buffer.writeUInt32BE(MATRIX[i], offset + 44 + i * 4);
        }
        // next track id
        buffer.writeUInt32BE(this.nextTrackId, offset + 104);
    }

    bufferSize() {
        return 108;
    }

}

module.exports = AtomMVHD;
