'use strict';

const Atom = require('../atom');
const Utils = require('../utils');

function readSize(buffer, offset) {
    let s = 0, i;
    for (i = 0; i < 4; i++) {
        let b = buffer[offset + i] & 0xff;
        s <<= 7;
        s |= b & 0x7f;
        if ((b & 0x80) === 0) {
            break;
        }
    }
    return {
        size: s,
        read: i + 1,
    };
}

class AtomESDS extends Atom {

    constructor() {
        super();

        this.streamId = null;
        this.extraData = null;
    }

    type() {
        return Utils.ATOM_ESDS;
    }

    parse(buffer) {
        let offset = 5;

        // ES_Length
        let esSize = readSize(buffer, offset);
        offset += esSize.read;

        // ES_ID
        this.streamId = buffer.readUInt16BE(offset);
        offset += 2;

        // Flags
        let flags = buffer[offset++];
        // streamDependenceFlag
        if (((flags >> 7) & 0x1) === 0x1) {
            offset += 2;
        }
        // URL_Flag
        if (((flags >> 6) & 0x1) === 0x1) {
            offset += buffer[offset] + 1;
        }
        // OCRstreamFlag
        if (((flags >> 5) & 0x1) === 0x1) {
            offset += 2;
        }

        while (offset < buffer.length) {
            let descriptorTag = buffer[offset++];
            let tagInfo = readSize(buffer, offset);
            offset += tagInfo.read;

            // Skip optional tags
            if (descriptorTag !== 4) {
                offset += tagInfo.size;
                continue;
            }

            // Skip DecoderConfigDescrTag parameters
            offset += 13;

            // Read DecoderSpecificInfo
            if (tagInfo.size > 13 && buffer[offset++] === 5) {
                tagInfo = readSize(buffer, offset);
                offset += tagInfo.read;
                this.extraData = Buffer.allocUnsafe(tagInfo.size);
                buffer.copy(this.extraData, 0, offset, offset + tagInfo.size);
            }
            break;
        }
    }

    build(buffer, offset) {
        // header
        buffer.writeUInt32BE(this.bufferSize(), offset);
        buffer.write(this.type(), offset + 4);
        offset += 8;

        // ES_DescrTag
        offset += 4;
        buffer[offset++] = 0x3;                         // tag type
        buffer[offset++] = 23 + this.extraData.length;  // tag length (by the end of the tag)
        buffer.writeUInt16BE(this.streamId, offset);    // ES_ID
        offset += 2;
        buffer[offset++] = 0;                           // ES_Flags

        // DecoderConfigDescrTag
        buffer[offset++] = 0x4;                         // tag type
        buffer[offset++] = 15 + this.extraData.length;  // tag length
        buffer[offset++] = 0x40;                        // objectTypeIndication - Audio ISO/IEC 14496-3
        buffer[offset++] = 0x15;                        // Flags - streamType - AudioStream
        offset += 11;                                   // Other optional tags

        // DecSpecificInfoTag (part of DecoderConfigDescrTag)
        buffer[offset++] = 0x5;                         // tag type
        buffer[offset++] = this.extraData.length;       // tag length
        this.extraData.copy(buffer, offset);
        offset += this.extraData.length;

        // SLConfigDescrTag
        buffer[offset++] = 0x6;                         // tag type
        buffer[offset++] = 1;                           // tag length
        buffer[offset++] = 0x2;                         // tag length
    }

    bufferSize() {
        return 37 + this.extraData.length;
    }

}

module.exports = AtomESDS;
