'use strict';

const PARSERS = {
    mp4a: require('./codec-aac'),
    avcC: require('./codec-h264'),
    hvcC: require('./codec-h265'),
};

class Parser {

    static parse(extraData) {
        let codecName = extraData.toString('ascii', 0, 4);
        let ParserClass = PARSERS[codecName];
        if (ParserClass) {
            let parser = new ParserClass(extraData.slice(4, extraData.length));
            parser.parse();
            return parser;
        }

        throw new Error(`Unknown codec name ${codecName}`);
    }

}

module.exports = Parser;
