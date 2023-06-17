'use strict';

const Atom = require('../atom');
const Utils = require('../utils');
const BufferUtils = require('../../buffer-utils');

class AtomMDHD extends Atom {

    constructor() {
        super();

        this.timescale = null;
        this.duration = null;
    }

    type() {
        return Utils.ATOM_MDHD;
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
        let version = this._version();
        buffer[offset + 8] = version;
        if (version === 1) {
            buffer.writeUInt32BE(this.timescale, offset + 28);
            BufferUtils.writeUInt64BE(buffer, this.duration, offset + 32);
        } else {
            buffer.writeUInt32BE(this.timescale, offset + 20);
            buffer.writeUInt32BE(this.duration, offset + 24);
        }
    }

    _version() {
        if (this.duration > 2147483647) {
            return 1;
        } else {
            return 0;
        }
    }

    bufferSize() {
        return this._version() === 1 ? 44 : 32;
    }

}

module.exports = AtomMDHD;
