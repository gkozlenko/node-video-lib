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
        read: i + 1,
    };
}

class AtomMP4A extends Atom {

    constructor() {
        super();

        this.channels = null;
        this.sampleSize = null;
        this.sampleRate = null;
        this.extraData = null;
    }

    type() {
        return Utils.ATOM_MP4A;
    }

    parse(buffer) {
        let offset = 8;
        let version = buffer.readUInt16BE(offset);
        offset += 8;
        this.channels = buffer.readUInt16BE(offset);
        offset += 2;
        this.sampleSize = buffer.readUInt16BE(offset);
        offset += 4;
        this.sampleRate = buffer.readUInt32BE(offset);
        offset += 6;
        if (version > 0) {
            offset += 16;
        }
        while (offset < buffer.length - 8) {
            let size = buffer.readUInt32BE(offset);
            offset += 4;
            let type = buffer.toString('ascii', offset, offset + 4);
            offset += 4;
            if (size === 0) {
                break;
            }
            if (type === Utils.ATOM_ESDS) {
                offset += 5;
                offset += readSize(buffer, offset).read;
                offset += 4;
                offset += readSize(buffer, offset).read;
                offset += 14;
                let extraSize = readSize(buffer, offset);
                offset += extraSize.read;
                if (0 < extraSize.size) {
                    this.extraData = new Buffer(4 + extraSize.size);
                    this.extraData.write(Utils.ATOM_MP4A);
                    buffer.copy(this.extraData, 4, offset, offset + extraSize.size);
                    offset += extraSize.size;
                }
                break;
            }
            offset += size - 8;
        }
    }

}

module.exports = AtomMP4A;
