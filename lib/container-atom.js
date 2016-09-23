'use strict';

var AtomUtil = require('./atom-util');
var Atom = require('./atom');
var util = require('util');

function ContainerAtom() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.atoms = [];
    this.availableAtoms = [];
}

util.inherits(ContainerAtom, Atom);

ContainerAtom.prototype.getAtoms = function(name) {
    var atoms = [];
    for (var i = 0, l = this.atoms.length; i < l; i++) {
        if (this.atoms[i].name === name) {
            atoms.push(this.atoms[i]);
        }
    }
    return atoms;
};

ContainerAtom.prototype.getAtom = function(name) {
    for (var i = 0, l = this.atoms.length; i < l; i++) {
        if (this.atoms[i].name === name) {
            return this.atoms[i];
        }
    }
    return null;
};

ContainerAtom.prototype.parse = function() {
    var limit = this.buffer.length;
    var offset = 0;
    while (offset < limit) {
        var size = this.buffer.readInt32BE(offset);
        var name = this.buffer.toString('ascii', offset + 4, offset + 8);
        if (0 == size) {
            break;
        }
        offset += 8;
        if (this.availableAtoms.indexOf(name) != -1) {
            var buffer = this.buffer.slice(offset, offset + size - AtomUtil.HEADER_SIZE);
            var atom = AtomUtil.createAtom(name, size, this.offset + offset, buffer);
            if (atom !== null) {
                atom.parse();
                this.atoms.push(atom);
            }
        }
        if (offset + size - AtomUtil.HEADER_SIZE <= limit) {
            offset += size - AtomUtil.HEADER_SIZE;
        } else {
            break;
        }
    }
};

ContainerAtom.prototype.toString = function(level) {
    level = level || 0;
    var output = Atom.prototype.toString.call(this, level) + "\n";
    for (var i = 0, l = this.atoms.length; i < l; i++) {
        output += this.atoms[i].toString(level + 1) + "\n"
    }
    return output.substr(0, output.length - 1);
};

module.exports = ContainerAtom;
