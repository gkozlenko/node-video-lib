'use strict';

const Reader = require('./reader');

class BufferReader extends Reader {

    constructor(buffer) {
        super();

        this.buffer = buffer;
    }

    size() {
        return this.buffer.length;
    }

    read(buffer, offset, targetOffset) {
        targetOffset = targetOffset || 0;
        return this.buffer.copy(buffer, targetOffset, offset, offset + buffer.length - targetOffset);
    }

}

module.exports = BufferReader;
