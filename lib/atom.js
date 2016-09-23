'use strict';

function Atom(type, size, offset, buffer) {
    this.type = type;
    this.size = size;
    this.offset = offset;
    this.buffer = buffer;
}

Atom.prototype.parse = function() {

};

Atom.prototype.toString = function(level) {
    level = level || 0;
    var output = '';
    for (var i = 0; i < level; i++) {
        output += "\t";
    }
    return output + '[' + this.type + ', size: ' + this.size + ', offset: ' + this.offset + ']';
};

module.exports = Atom;
