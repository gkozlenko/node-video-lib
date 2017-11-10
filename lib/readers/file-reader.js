'use strict';

const fs = require('fs');

const AbstractReader = require('./abstract-reader');

class FileReader extends AbstractReader {

    constructor(fd) {
        super();
        this.fd = fd;
    }

    size() {
        return fs.fstatSync(this.fd).size;
    }

    read(buffer, offset) {
        return fs.readSync(this.fd, buffer, 0, buffer.length, offset);
    }

}

module.exports = FileReader;
