'use strict';

var util = require('util');
var Atom = require('../atom');

function AtomCTTS() {
    Atom.apply(this, Array.prototype.slice.call(arguments));

    this.entries = [];
}

util.inherits(AtomCTTS, Atom);

AtomCTTS.prototype.parse = function() {
    var i, j, l;
    var tmpCount = this.buffer.readUInt32BE(4);
    var tmp = new Array(2 * tmpCount);
    var count = 0;
    for (i = 0, l = 2 * tmpCount; i < l; i++) {
        tmp[i] = this.buffer.readUInt32BE(8 + 4 * i);
        if (!(i % 2)) {
            count += tmp[i];
        }
    }
    var pos = 0;
    this.entries = new Array(count);
    for (i = 0, l = tmp.length; i < l; i += 2) {
        for (j = 0; j < tmp[i]; j++) {
            this.entries[pos++] = tmp[i + 1];
        }
    }
};

module.exports = AtomCTTS;
