'use strict';

module.exports = {
    HEADER_SIZE: 8,

    ATOM_MOOV: 'moov',
    ATOM_MVHD: 'mvhd',
    ATOM_TRAK: 'trak',
    ATOM_TKHD: 'tkhd',
    ATOM_MDIA: 'mdia',

    createAtom: function createAtom(type, size, offset, buffer) {
        var AtomClass = require('./atoms/atom-' + type);
        return new AtomClass(type, size, offset, buffer);
    }
};
