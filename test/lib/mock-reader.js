'use strict';

const Reader = require('../../lib/readers/reader');

class MockReader extends Reader {

    constructor(size) {
        super();
        this.size = size;
        this.calls = [];
    }

    size() {
        return this.size;
    }

    read(buffer, offset) {
        this.calls.push({
            offset: offset,
            size: buffer.length,
        });
    }

}

module.exports = MockReader;
