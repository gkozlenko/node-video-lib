'use strict';

const MediaHeaderAtom = require('../media-header-atom');
const Utils = require('../utils');

const MATRIX = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000];

class AtomMVHD extends MediaHeaderAtom {

    type() {
        return Utils.ATOM_MVHD;
    }

    build(movie) {
        let buffer = Buffer.alloc(100);

        // timescale
        buffer.writeUInt32BE(this.timescale, 12);
        // duration
        buffer.writeUInt32BE(this.duration, 16);
        // preferred rate
        buffer.writeUInt32BE(0x10000, 20);
        // preferred volume
        buffer.writeUInt16BE(0x100, 24);
        // matrix
        for (let i = 0; i < MATRIX.length; i++) {
            buffer.writeUInt32BE(MATRIX[i], 36 + i * 4);
        }
        // next track id
        buffer.writeUInt32BE(movie.tracks.length + 1, 96);

        return buffer;
    }

}

module.exports = AtomMVHD;
