'use strict';

var MediaUtil = require('./media-util');
var Atom = require('./atom');
var util = require('util');

function ContainerAtom() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.atoms = [];
    this.availableAtoms = [];
}

util.inherits(ContainerAtom, Atom);

ContainerAtom.prototype.getAtoms = function(type) {
    var atoms = [];
    for (var i = 0, l = this.atoms.length; i < l; i++) {
        if (this.atoms[i].type === type) {
            atoms.push(this.atoms[i]);
        }
    }
    return atoms;
};

ContainerAtom.prototype.getAtom = function(type) {
    for (var i = 0, l = this.atoms.length; i < l; i++) {
        if (this.atoms[i].type === type) {
            return this.atoms[i];
        }
    }
    return null;
};

ContainerAtom.prototype.parse = function() {
    var limit = this.buffer.length;
    var offset = 0;
    while (offset < limit) {
        var size = this.buffer.readUInt32BE(offset);
        var name = this.buffer.toString('ascii', offset + 4, offset + 8);
        if (0 == size) {
            break;
        }
        offset += 8;
        if (this.availableAtoms.indexOf(name) != -1) {
            var buffer = this.buffer.slice(offset, offset + size - MediaUtil.HEADER_SIZE);
            var atom = MediaUtil.createAtom(name, size, this.offset + offset, buffer);
            if (atom !== null) {
                atom.parse();
                this.atoms.push(atom);
            }
        }
        if (offset + size - MediaUtil.HEADER_SIZE <= limit) {
            offset += size - MediaUtil.HEADER_SIZE;
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
