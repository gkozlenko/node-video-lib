'use strict';

const Atom = require('../atom');

class AtomHDLR extends Atom {

    constructor(type, size, offset, buffer) {
        super(type, size, offset, buffer);

        this.handlerType = null;
    }

    parse() {
        this.handlerType = this.buffer.toString('ascii', 8, 12);
    }

}

module.exports = AtomHDLR;
