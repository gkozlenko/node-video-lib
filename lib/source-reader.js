'use strict';

const AbstractReader = require('./readers/abstract-reader');
const FileReader = require('./readers/file-reader');
const BufferReader = require('./readers/buffer-reader');

class SourceReader {

    constructor(source) {
        if (source instanceof AbstractReader) {
            return source;
        } else if (source instanceof Buffer) {
            return new BufferReader(source);
        } else {
            return new FileReader(source);
        }
    }

}

module.exports = SourceReader;
