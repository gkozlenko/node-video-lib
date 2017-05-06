'use strict';

const fs = require('fs');

const AbstractReader = require('./abstract-reader');

class FileReader extends AbstractReader {

    constructor(fd) {
        super();
        this.buffer = fd;
    }

    size() {
        return fs.fstatSync(this.buffer).size;
    }

    read(buffer, offset) {
        return fs.readSync(this.buffer, buffer, 0, buffer.length, offset);
    }

}

module.exports = FileReader;
