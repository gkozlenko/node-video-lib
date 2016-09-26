'use strict';

var util = require('util');
var Atom = require('../atom');
var AtomUtil = require('../atom-util');

function readSize(buffer, offset) {
    var s = 0, i;
    for (i = 0; i < 4; i++) {
        var b = buffer[offset + i] & 0xff;
        s <<= 7;
        s |= b & 0x7f;
        if (0 == (b & 0x80)) {
            break;
        }
    }
    return {
        size: s,
        read: i + 1
    };
}

function AtomMP4A() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.channels = null;
    this.sampleSize = null;
    this.sampleRate = null;
}

util.inherits(AtomMP4A, Atom);

AtomMP4A.prototype.parse = function() {
    var offset = 8;
    var version = this.buffer.readUInt16BE(offset);
    offset += 8;
    this.channels = this.buffer.readUInt16BE(offset);
    offset += 2;
    this.sampleSize = this.buffer.readUInt16BE(offset);
    offset += 4;
    this.sampleRate = this.buffer.readUInt32BE(offset);
    offset += 6;
    if (version > 0) {
        offset += 16;
    }
    while (offset < this.buffer.length - AtomUtil.HEADER_SIZE) {
        var size = this.buffer.readUInt32BE(offset);
        offset += 4;
        var type = this.buffer.toString('ascii', offset, offset + 4);
        offset += 4;
        if (size === 0) {
            break;
        }
        if (type === AtomUtil.ATOM_ESDS) {
            offset += 5;
            offset += readSize(this.buffer, offset).read;
            offset += 4;
            offset += readSize(this.buffer, offset).read;
            offset += 14;
            var extraSize = readSize(this.buffer, offset);
            offset += extraSize.read;
            if (0 < extraSize.size) {
                this.extraData = this.buffer.slice(offset, offset + extraSize.size);
                offset += extraSize.size;
            }
            break;
        }
        offset += size - AtomUtil.HEADER_SIZE;
    }
};

module.exports = AtomMP4A;
