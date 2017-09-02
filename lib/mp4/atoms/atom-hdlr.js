'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomHDLR extends Atom {

    constructor() {
        super();

        this.handlerType = null;
    }

    type() {
        return Utils.ATOM_HDLR;
    }

    parse(buffer) {
        this.handlerType = buffer.toString('ascii', 8, 12);
    }

}

module.exports = AtomHDLR;
