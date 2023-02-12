'use strict';

const Atom = require('./atom');

class ContainerAtom extends Atom {

    constructor() {
        super();

        this.atoms = [];
    }

    availableAtomClasses() {
        return {};
    }

    addAtom(atom) {
        this.atoms.push(atom);
    }

    createAtom(type) {
        const AtomClass = this.availableAtomClasses()[type];
        if (AtomClass) {
            let atom = new AtomClass();
            this.addAtom(atom);
            return atom;
        }

        throw new Error(`Unknown atom ${type}`);
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
            if (this.availableAtomClasses()[name] !== undefined) {
                let atom = this.createAtom(name);
                atom.parse(buffer.subarray(offset, offset + size - 8));
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
