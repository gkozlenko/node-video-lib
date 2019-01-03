'use strict';

const Utils = require('./utils');
const ParserImpl = require('./parser-impl');

class Parser {

    /**
     * Parse FLV file
     * @param {(int|Buffer)} source
     * @returns {Movie}
     */
    static parse(source) {
        let parser = new ParserImpl(source);
        return parser.parse();
    }

    /**
     * Check FLV file
     * @param {Buffer} buffer
     * @returns {boolean}
     * @private
     */
    static check(buffer) {
        return buffer.toString('ascii', 0, 3) === Utils.HEADER_PREFIX && buffer[3] === Utils.HEADER_VERSION;
    }

}

module.exports = Parser;
