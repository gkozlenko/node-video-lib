'use strict';

const AbstractReader = require('./abstract-reader');

class BufferReader extends AbstractReader {

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
