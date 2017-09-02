'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

function rightPad(string, length) {
    string = string || '';
    return string.length < length ? string + ' '.repeat(length - string.length) : string;
}

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
        for (let i = 8; i < buffer.length; i += 4) {
            this.compatibleBrands.push(buffer.toString('ascii', i, i + 4).trim());
        }
    }

    build() {
        let buffer = new Buffer(8 + 4 * this.compatibleBrands.length);
        buffer.write(rightPad(this.majorBrand, 4), 0, 4);
        buffer.writeUInt32BE(this.minorVersion, 4);
        for (let i = 0, l = this.compatibleBrands.length; i < l; i++) {
            buffer.write(rightPad(this.compatibleBrands[i], 4), 8 + 4 * i, 4);
        }
        return buffer;
    }

}

module.exports = AtomFTYP;
