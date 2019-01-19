'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

class AtomHDLR extends Atom {

    constructor() {
        super();

        this.handlerType = null;
        this.componentName = null;
    }

    type() {
        return Utils.ATOM_HDLR;
    }

    parse(buffer) {
        this.handlerType = buffer.toString('ascii', 8, 12);
        this.componentName = buffer.toString('ascii', 16);
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // handler name
        buffer.write(this.handlerType, offset + 16);
        // component name
        buffer.write(this.componentName, offset + 24);
    }

    bufferSize() {
        return 32 + this.componentName.length;
    }

}

module.exports = AtomHDLR;
