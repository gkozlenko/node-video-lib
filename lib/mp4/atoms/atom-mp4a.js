'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomMP4A extends Atom {

    constructor() {
        super();

        this.channels = null;
        this.sampleSize = null;
        this.sampleRate = null;
        this.streamId = null;
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
                    this.streamId = atom.streamId;
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

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // data reference index
        buffer.writeUInt16BE(1, offset + 14);
        // number of channels
        buffer.writeUInt16BE(this.channels, offset + 24);
        // sample size
        buffer.writeUInt16BE(this.sampleSize, offset + 26);
        // sample rate
        buffer.writeUInt32BE(this.sampleRate, offset + 30);

        // ESDS atom
        let atom = Utils.createAtom(Utils.ATOM_ESDS);
        atom.streamId = this.streamId;
        atom.extraData = Buffer.allocUnsafe(this.extraData.length - 4);
        this.extraData.copy(atom.extraData, 0, 4);
        atom.build(buffer, offset + 36);
    }

    bufferSize() {
        return 36 + 37 + this.extraData.length;
    }

}

module.exports = AtomMP4A;
