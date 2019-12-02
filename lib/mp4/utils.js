'use strict';

module.exports = {
    ATOM_MOOV: 'moov',
    ATOM_MVHD: 'mvhd',
    ATOM_TRAK: 'trak',
    ATOM_TKHD: 'tkhd',
    ATOM_MDIA: 'mdia',
    ATOM_MDHD: 'mdhd',
    ATOM_MINF: 'minf',
    ATOM_HDLR: 'hdlr',
    ATOM_VMHD: 'vmhd',
    ATOM_SMHD: 'smhd',
    ATOM_STBL: 'stbl',
    ATOM_STSZ: 'stsz',
    ATOM_STCO: 'stco',
    ATOM_STSS: 'stss',
    ATOM_STTS: 'stts',
    ATOM_STSC: 'stsc',
    ATOM_CO64: 'co64',
    ATOM_STSD: 'stsd',
    ATOM_CTTS: 'ctts',
    ATOM_AVC1: 'avc1',
    ATOM_AVCC: 'avcC',
    ATOM_HEV1: 'hev1',
    ATOM_HVC1: 'hvc1',
    ATOM_HVCC: 'hvcC',
    ATOM_MP4A: 'mp4a',
    ATOM_ESDS: 'esds',
    ATOM_MDAT: 'mdat',
    ATOM_FTYP: 'ftyp',

    TRACK_TYPE_VIDEO: 'vide',
    TRACK_TYPE_AUDIO: 'soun',

    COMPONENT_NAME_VIDEO: 'VideoHandler',
    COMPONENT_NAME_AUDIO: 'SoundHandler',

    COMPRESSOR_NAME: 'NodeVideoLibrary', // should be exactly 16 symbols

    createAtom: function createAtom(type) {
        let AtomClass = require('./atoms/atom-' + type);
        return new AtomClass();
    },
};
