'use strict';

const fs = require('fs');
const Reader = require('./reader');

class FileReader extends Reader {

    constructor(fd) {
        super();

        this.fd = fd;
    }

    size() {
        return fs.fstatSync(this.fd).size;
    }

    read(buffer, offset, targetOffset) {
        targetOffset = targetOffset || 0;
        return fs.readSync(this.fd, buffer, targetOffset, buffer.length - targetOffset, offset);
    }

}

module.exports = FileReader;
