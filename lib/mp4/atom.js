'use strict';

class Atom {

    constructor(type, size, offset, buffer) {
        this.type = type;
        this.size = size;
        this.offset = offset;
        this.buffer = buffer;
    }

    parse() {

    }

    toString(level) {
        level = level || 0;
        let output = '';
        for (let i = 0; i < level; i++) {
            output += "\t";
        }
        return output + '[' + this.type + ', size: ' + this.size + ', offset: ' + this.offset + ']';
    }

}

module.exports = Atom;
