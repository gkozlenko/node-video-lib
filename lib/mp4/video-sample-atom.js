'use strict';

const Atom = require('./atom');

class VideoSampleAtom extends Atom {

    constructor() {
        super();

        this.width = null;
        this.height = null;
        this.extraData = null;
    }

    extraType() {

    }

    parse(buffer) {
        let offset = 24;
        this.width = buffer.readUInt16BE(offset);
        offset += 2;
        this.height = buffer.readUInt16BE(offset);
        offset += 52;
        while (offset < buffer.length - 8) {
            let size = buffer.readUInt32BE(offset);
            offset += 4;
            let type = buffer.toString('ascii', offset, offset + 4);
            offset += 4;
            if (size === 0) {
                break;
            }
            if (type === this.extraType()) {
                this.extraData = buffer.slice(offset - 4, offset + size - 4);
                break;
            }
            offset += size - 8;
        }
    }

}

module.exports = VideoSampleAtom;
