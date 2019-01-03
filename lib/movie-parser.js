'use strict';

const SourceReader = require('./readers/source-reader');

const PARSERS = [
    require('./mp4/parser'),
    require('./flv/parser'),
];

const HEADER_SIZE = 8;

class MovieParser {

    static parse(source) {
        let reader = SourceReader.create(source);
        let header = Buffer.allocUnsafe(HEADER_SIZE);
        reader.read(header, 0);

        for (let parser of PARSERS) {
            if (parser.check(header)) {
                return parser.parse(source);
            }
        }

        throw new Error('Cannot parse movie file');
    }

}

module.exports = MovieParser;
