'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomSTSD extends ContainerAtom {

    type() {
        return Utils.ATOM_STSD;
    }

    availableAtoms() {
        return [Utils.ATOM_AVC1, Utils.ATOM_HEV1, Utils.ATOM_HVC1, Utils.ATOM_MP4A];
    }

    getVideoAtom() {
        return this.getAtom(Utils.ATOM_AVC1) || this.getAtom(Utils.ATOM_HEV1) || this.getAtom(Utils.ATOM_HVC1);
    }

    getAudioAtom() {
        return this.getAtom(Utils.ATOM_MP4A);
    }

    parse(buffer) {
        super.parse(buffer.slice(8));
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
