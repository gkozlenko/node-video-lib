'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

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
            let name = buffer.toString('ascii', offset + 4, offset + 8);
            if (size === 0) {
                break;
            }
            offset += 8;
            if (name === Utils.ATOM_ESDS) {
                let atom = Utils.createAtom(name);
                if (atom !== null) {
                    atom.parse(buffer.slice(offset, offset + size - 8));
                    if (atom.extraData) {
                        this.extraData = Buffer.allocUnsafe(4 + atom.extraData.length);
                        this.extraData.write(Utils.ATOM_MP4A);
                        atom.extraData.copy(this.extraData, 4, 0);
                    }
                }
                break;
            }
            offset += size - 8;
        }
    }

}

module.exports = AtomMP4A;
