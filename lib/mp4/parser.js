'use strict';

const Utils = require('./utils');
const ParserImpl = require('./parser-impl');

class Parser {

    /**
     * Parse MP4 file
     * @param {(int|Buffer)} source
     * @returns {Movie}
     */
    static parse(source) {
        let parser = new ParserImpl(source);
        return parser.parse();
    }

    /**
     * Check MP4 file
     * @param {Buffer} buffer
     * @returns {boolean}
     * @private
     */
    static check(buffer) {
        return buffer.readUInt32BE(0) > 0 &&
            [Utils.ATOM_FTYP, Utils.ATOM_MOOV, Utils.ATOM_MDAT].indexOf(buffer.toString('ascii', 4, 8)) !== -1;
    }

}

module.exports = Parser;
