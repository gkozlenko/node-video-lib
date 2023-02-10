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
        let nullIndex = buffer.indexOf(0, 24);
        this.componentName = buffer.toString('ascii', 24, nullIndex > -1 ? nullIndex : undefined);
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // handler type
        buffer.write(this.handlerType.substring(0, 4), offset + 16);
        // component name
        buffer.write(this.componentName.substring(0, 12), offset + 32);
    }

    bufferSize() {
        return 45;
    }

}

module.exports = AtomHDLR;
