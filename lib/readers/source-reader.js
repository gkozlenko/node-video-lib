'use strict';

const Reader = require('./reader');
const FileReader = require('./file-reader');
const BufferReader = require('./buffer-reader');

class SourceReader {

    /**
     * Create source reader
     * @param source
     * @returns Reader
     */
    static create(source) {
        if (source instanceof Reader) {
            return source;
        } else if (source instanceof Buffer) {
            return new BufferReader(source);
        } else {
            return new FileReader(source);
        }
    }

}

module.exports = SourceReader;
