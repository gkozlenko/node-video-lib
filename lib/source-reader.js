'use strict';

const fs = require('fs');

class AbstractReader {

    constructor(source) {
        this.source = source;
    }

    size() {
        return 0;
    }

    read() {
        return 0;
    }

}

class FileReader extends AbstractReader {

    size() {
        return fs.fstatSync(this.source).size;
    }

    read(buffer, offset) {
        return fs.readSync(this.source, buffer, 0, buffer.length, offset);
    }

}

class BufferReader extends AbstractReader {

    size() {
        return this.source.length;
    }

    read(buffer, offset) {
        return this.source.copy(buffer, 0, offset, offset + buffer.length);
    }

}

class SourceReader {

    constructor(source) {
        if (source instanceof Buffer) {
            return new BufferReader(source);
        } else {
            return new FileReader(source);
        }
    }

}

module.exports = SourceReader;
