'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomFTYP extends Atom {

    constructor() {
        super();

        this.majorBrand = null;
        this.minorVersion = 0;
        this.compatibleBrands = [];
    }

    type() {
        return Utils.ATOM_FTYP;
    }

    parse(buffer) {
        this.majorBrand = buffer.toString('ascii', 0, 4);
        this.minorVersion = buffer.readUInt32BE(4);
        for (let i = 0; i < (buffer.length - 8) / 4; i++) {
            this.compatibleBrands.push(buffer.toString('ascii', 8 + i * 4, 12 + i * 4));
        }
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // major brand
        buffer.write(this.majorBrand, offset + 8);
        // minor version
        buffer.writeUInt32BE(this.minorVersion, offset + 12);
        // compatible brands
        for (let i = 0; i < this.compatibleBrands.length; i++) {
            buffer.write(this.compatibleBrands[i], offset + 16 + i * 4);
        }
    }

    bufferSize() {
        return 16 + 4 * this.compatibleBrands.length;
    }

}

module.exports = AtomFTYP;
