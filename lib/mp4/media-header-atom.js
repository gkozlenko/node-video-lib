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

}

module.exports = MediaHeaderAtom;
