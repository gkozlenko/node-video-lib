'use strict';

const Fragment = require('../fragment');
const FragmentList = require('../fragment-list');
const Utils = require('../mp4/utils');

class Packetizer {

    static videoIndex(fragmentList) {
        if (!(fragmentList instanceof FragmentList)) {
            throw new Error('Argument 1 should be instance of FragmentList');
        }

        if (fragmentList.video === null) {
            throw new Error('Video track does not exist');
        }

        let ftyp = Utils.createAtom(Utils.ATOM_FTYP);
        ftyp.majorBrand = 'isom';
        ftyp.compatibleBrands = ['avc1', 'mp42', 'dash'];

        let moov = Utils.createAtom(Utils.ATOM_MOOV);
        moov.getAtom(Utils.ATOM_MVHD);

        return Utils.buildAtoms([ftyp, moov]);
    }

    static audioIndex(fragmentList) {
        if (!(fragmentList instanceof FragmentList)) {
            throw new Error('Argument 1 should be instance of FragmentList');
        }

        if (fragmentList.audio === null) {
            throw new Error('Audio track does not exist');
        }

        let ftyp = Utils.createAtom(Utils.ATOM_FTYP);
        ftyp.majorBrand = 'isom';
        ftyp.compatibleBrands = ['M4A', 'mp42', 'dash'];

        let moov = Utils.createAtom(Utils.ATOM_MOOV);

        return Utils.buildAtoms([ftyp, moov]);
    }

    static videoPacket(fragment, sampleBuffers) {
        if (!(fragment instanceof Fragment)) {
            throw new Error('Argument 1 should be instance of Fragment');
        }
        sampleBuffers;
        return null;
    }

    static audioPacket(fragment, sampleBuffers) {
        if (!(fragment instanceof Fragment)) {
            throw new Error('Argument 1 should be instance of Fragment');
        }
        sampleBuffers;
        return null;
    }

}

module.exports = Packetizer;
