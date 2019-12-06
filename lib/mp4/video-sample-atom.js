'use strict';

const Atom = require('./atom');
const Utils = require('./utils');

const VIDEO_DPI = 72 << 16;
const VIDEO_DEPTH = 24;

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

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        // data reference index
        buffer.writeUInt16BE(1, offset + 14);
        // vendor
        buffer.writeUInt32BE(1, offset + 20);
        // width and height
        buffer.writeUInt16BE(this.width, offset + 32);
        buffer.writeUInt16BE(this.height, offset + 34);
        // horizontal and vertical resolution
        buffer.writeUInt32BE(VIDEO_DPI, offset + 36);
        buffer.writeUInt32BE(VIDEO_DPI, offset + 40);
        // frame count
        buffer.writeUInt16BE(1, offset + 48);
        // compressor name
        buffer.write(Utils.COMPRESSOR_NAME.substring(0, 16), offset + 50);
        // depth
        buffer.writeUInt16BE(VIDEO_DEPTH, offset + 82);
        // color table id
        buffer.writeUInt16BE(65535, offset + 84); // default color table
        // extra data
        buffer.writeUInt32BE(this.extraData.length + 4, offset + 86);
        buffer.write(this.extraType(), offset + 90);
        this.extraData.copy(buffer, offset + 94, 4);
    }

    bufferSize() {
        return 90 + this.extraData.length;
    }

}

module.exports = VideoSampleAtom;
