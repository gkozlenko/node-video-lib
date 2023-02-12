'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

const ATOM_CLASSES = {
    avc1: require('./atom-avc1'),
    hev1: require('./atom-hev1'),
    hvc1: require('./atom-hvc1'),
    mp4a: require('./atom-mp4a'),
};

class AtomSTSD extends ContainerAtom {

    type() {
        return Utils.ATOM_STSD;
    }

    availableAtomClasses() {
        return ATOM_CLASSES;
    }

    getVideoAtom() {
        return this.getAtom(Utils.ATOM_AVC1) || this.getAtom(Utils.ATOM_HEV1) || this.getAtom(Utils.ATOM_HVC1);
    }

    getAudioAtom() {
        return this.getAtom(Utils.ATOM_MP4A);
    }

    parse(buffer) {
        super.parse(buffer.subarray(8));
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        buffer.writeUInt32BE(1, offset + 12);
        // atoms
        offset += 16;
        for (let atom of this.atoms) {
            atom.build(buffer, offset);
            offset += atom.bufferSize();
        }
    }

    bufferSize() {
        return 8 + super.bufferSize();
    }

}

module.exports = AtomSTSD;
