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

    read(buffer, offset) {
        return this.buffer.copy(buffer, 0, offset, offset + buffer.length);
    }

}

module.exports = BufferReader;
