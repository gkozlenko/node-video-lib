'use strict';

module.exports = {
    HEADER_SIZE: 8,

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
    ATOM_DINF: 'dinf',
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
    ATOM_MP4A: 'mp4a',
    ATOM_AVCC: 'avcC',
    ATOM_ESDS: 'esds',

    TRACK_TYPE_VIDEO: 'vide',
    TRACK_TYPE_AUDIO: 'soun',

    createAtom: function createAtom(type, size, offset, buffer) {
        var AtomClass = require('./atoms/atom-' + type);
        return new AtomClass(type, size, offset, buffer);
    }
};
