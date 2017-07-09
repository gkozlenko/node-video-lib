'use strict';

const SourceReader = require('./source-reader');

const PARSERS = [
    require('./mp4/parser'),
    require('./flv/parser'),
];

const HEADER_SIZE = 8;

class MovieParser {

    static parse(source) {
        let reader = new SourceReader(source);
        let header = new Buffer(HEADER_SIZE);
        reader.read(header, 0);

        for (let parser of PARSERS) {
            if (parser._check(header)) {
                return parser.parse(source);
            }
        }

        throw new Error('Cannot parse movie file');
    }

}

module.exports = MovieParser;
