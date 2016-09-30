'use strict';

var util = require('util');
var Atom = require('../atom');
var MediaUtil = require('../media-util');

function AtomAVC1() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.width = null;
    this.height = null;
    this.extraData = null;
}

util.inherits(AtomAVC1, Atom);

AtomAVC1.prototype.parse = function() {
    var offset = 24;
    this.width = this.buffer.readUInt16BE(offset);
    offset += 2;
    this.height = this.buffer.readUInt16BE(offset);
    offset += 52;
    while (offset < this.buffer.length - MediaUtil.HEADER_SIZE) {
        var size = this.buffer.readUInt32BE(offset);
        offset += 4;
        var type = this.buffer.toString('ascii', offset, offset + 4);
        offset += 4;
        if (size === 0) {
            break;
        }
        if (type === MediaUtil.ATOM_AVCC) {
            this.extraData = this.buffer.slice(offset);
            break;
        }
        offset += size - MediaUtil.HEADER_SIZE;
    }
};


module.exports = AtomAVC1;
