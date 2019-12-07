'use strict';

const Atom = require('./atom');
const Utils = require('./utils');

class ContainerAtom extends Atom {

    constructor() {
        super();

        this.atoms = [];
    }

    availableAtoms() {
        return [];
    }

    addAtom(atom) {
        this.atoms.push(atom);
    }

    createAtom(type) {
        let atom = Utils.createAtom(type);
        this.addAtom(atom);
        return atom;
    }

    getAtoms(type) {
        let atoms = [];
        for (let atom of this.atoms) {
            if (atom.type() === type) {
                atoms.push(atom);
            }
        }
        return atoms;
    }

    getAtom(type) {
        for (let atom of this.atoms) {
            if (atom.type() === type) {
                return atom;
            }
        }
        return null;
    }

    parse(buffer) {
        let limit = buffer.length;
        let offset = 0;
        while (offset < limit) {
            let size = buffer.readUInt32BE(offset);
            let name = buffer.toString('ascii', offset + 4, offset + 8);
            if (size === 0) {
                break;
            }
            offset += 8;
            if (this.availableAtoms().indexOf(name) !== -1) {
                let atom = Utils.createAtom(name);
                if (atom !== null) {
                    atom.parse(buffer.slice(offset, offset + size - 8));
                    this.addAtom(atom);
                }
            }
            if (offset + size - 8 <= limit) {
                offset += size - 8;
            } else {
                break;
            }
        }
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // atoms
        offset += 8;
        for (let atom of this.atoms) {
            atom.build(buffer, offset);
            offset += atom.bufferSize();
        }
    }

    bufferSize() {
        return 8 + this.atoms.reduce((size, atom) => size + atom.bufferSize(), 0);
    }

}

module.exports = ContainerAtom;
