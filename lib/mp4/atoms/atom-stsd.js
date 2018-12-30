'use strict';

const ContainerAtom = require('../container-atom');
const Utils = require('../utils');

class AtomSTSD extends ContainerAtom {

    type() {
        return Utils.ATOM_STSD;
    }

    availableAtoms() {
        return [Utils.ATOM_AVC1, Utils.ATOM_HEV1, Utils.ATOM_MP4A];
    }

    getVideoAtom() {
        return this.getAtom(Utils.ATOM_AVC1) || this.getAtom(Utils.ATOM_HEV1);
    }

    getAudioAtom() {
        return this.getAtom(Utils.ATOM_MP4A);
    }

    parse(buffer) {
        super.parse(buffer.slice(8));
    }

}

module.exports = AtomSTSD;
