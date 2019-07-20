'use strict';

const Atom = require('./atom');
const BufferUtils = require('../buffer-utils');

class MediaHeaderAtom extends Atom {

    constructor() {
        super();

        this.timescale = null;
        this.duration = null;
    }

    parse(buffer) {
        let version = buffer[0];
        if (version === 1) {
            this.timescale = buffer.readUInt32BE(20);
            this.duration = BufferUtils.readUInt64BE(buffer, 24);
        } else {
            this.timescale = buffer.readUInt32BE(12);
            this.duration = buffer.readUInt32BE(16);
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
    }

    bufferSize() {
        return 32;
    }

}

module.exports = MediaHeaderAtom;
