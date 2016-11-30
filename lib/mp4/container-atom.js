'use strict';

const Atom = require('./atom');
const Utils = require('./utils');

class ContainerAtom extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.atoms = [];
    }

    availableAtoms() {
        return [];
    }

    getAtoms(type) {
        let atoms = [];
        for (let atom of this.atoms) {
            if (atom.type === type) {
                atoms.push(atom);
            }
        }
        return atoms;
    }

    getAtom(type) {
        for (let atom of this.atoms) {
            if (atom.type === type) {
                return atom;
            }
        }
        return null;
    }

    parse() {
        let limit = this.buffer.length;
        let offset = 0;
        while (offset < limit) {
            let size = this.buffer.readUInt32BE(offset);
            let name = this.buffer.toString('ascii', offset + 4, offset + 8);
            if (size === 0) {
                break;
            }
            offset += 8;
            if (this.availableAtoms().indexOf(name) !== -1) {
                let buffer = this.buffer.slice(offset, offset + size - 8);
                let atom = Utils.createAtom(name, size, this.offset + offset, buffer);
                if (atom !== null) {
                    atom.parse();
                    this.atoms.push(atom);
                }
            }
            if (offset + size - 8 <= limit) {
                offset += size - 8;
            } else {
                break;
            }
        }
    }

    toString(level) {
        level = level || 0;
        let output = super.toString(level) + "\n";
        for (let atom of this.atoms) {
            output += atom.toString(level + 1) + "\n"
        }
        return output.substr(0, output.length - 1);
    }

}

module.exports = ContainerAtom;
