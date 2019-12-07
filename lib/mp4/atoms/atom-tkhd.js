'use strict';

const Atom = require('../atom');
const BufferUtils = require('../../buffer-utils');
const Utils = require('../utils');

const MATRIX = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000];

class AtomTKHD extends Atom {

    constructor() {
        super();

        this.duration = null;
        this.trackId = null;
        this.width = null;
        this.height = null;
    }

    type() {
        return Utils.ATOM_TKHD;
    }

    parse(buffer) {
        this.trackId = buffer.readUInt32BE(12);
        if (buffer[0] === 1) {
            this.duration = BufferUtils.readUInt64BE(buffer, 28);
            this.width = buffer.readUInt16BE(88);
            this.height = buffer.readUInt16BE(92);
        } else {
            this.duration = buffer.readUInt32BE(20);
            this.width = buffer.readUInt16BE(76);
            this.height = buffer.readUInt16BE(80);
        }
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // flags
        buffer.writeUInt32BE(3, offset + 8);
        // track id
        buffer.writeUInt32BE(this.trackId, offset + 20);
        // duration
        buffer.writeUInt32BE(this.duration, offset + 28);
        if (this.width === null || this.height === null) {
            // alternative group
            buffer.writeUInt16BE(1, offset + 42);
            // volume
            buffer.writeUInt16BE(256, offset + 44);
        } else {
            // width
            buffer.writeUInt16BE(this.width, offset + 84);
            // height
            buffer.writeUInt16BE(this.height, offset + 88);
        }
        // matrix
        for (let i = 0; i < MATRIX.length; i++) {
            buffer.writeUInt32BE(MATRIX[i], offset + 48 + i * 4);
        }
    }

    bufferSize() {
        return 92;
    }

}

module.exports = AtomTKHD;
