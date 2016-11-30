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
        read: i + 1
    };
}

class AtomMP4A extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.channels = null;
        this.sampleSize = null;
        this.sampleRate = null;
    }

    parse() {
        let offset = 8;
        let version = this.buffer.readUInt16BE(offset);
        offset += 8;
        this.channels = this.buffer.readUInt16BE(offset);
        offset += 2;
        this.sampleSize = this.buffer.readUInt16BE(offset);
        offset += 4;
        this.sampleRate = this.buffer.readUInt32BE(offset);
        offset += 6;
        if (version > 0) {
            offset += 16;
        }
        while (offset < this.buffer.length - 8) {
            let size = this.buffer.readUInt32BE(offset);
            offset += 4;
            let type = this.buffer.toString('ascii', offset, offset + 4);
            offset += 4;
            if (size === 0) {
                break;
            }
            if (type === Utils.ATOM_ESDS) {
                offset += 5;
                offset += readSize(this.buffer, offset).read;
                offset += 4;
                offset += readSize(this.buffer, offset).read;
                offset += 14;
                let extraSize = readSize(this.buffer, offset);
                offset += extraSize.read;
                if (0 < extraSize.size) {
                    this.extraData = this.buffer.slice(offset, offset + extraSize.size);
                    offset += extraSize.size;
                }
                break;
            }
            offset += size - 8;
        }
    }

}

module.exports = AtomMP4A;
