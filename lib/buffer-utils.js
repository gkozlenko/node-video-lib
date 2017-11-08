'use strict';

const VAL32 = 0x100000000;

module.exports = {

    readInt64BE: function readInt64BE(buffer, offset) {
        let negate = buffer[offset] & 0x80, x = 0, carry = 1;
        for (let i = 7, m = 1; i >= 0; i--, m *= 256) {
            let v = buffer[offset + i];
            if (negate) {
                v = (v ^ 0xff) + carry;
                carry = v >> 8;
                v = v & 0xff;
            }
            x += v * m;
        }
        return negate ? -x : x;
    },

    writeInt64BE: function writeInt64BE(buffer, value, offset) {
        let hi = 0;
        let lo = value;
        if (value > VAL32) {
            hi = (value / VAL32) << 0;
            lo = value % VAL32;
        }
        buffer.writeUInt32BE(hi, offset);
        buffer.writeUInt32BE(lo, offset + 4);
    },

    readInt24BE: function readInt24BE(buffer, offset) {
        return (buffer[offset] & 0xff) * 0x10000 + (buffer[offset + 1] & 0xff) * 0x100 + (buffer[offset + 2] & 0xff);
    },

    writeInt24BE: function writeInt24BE(buffer, value, offset) {
        buffer[offset] = (value / 0x10000) & 0xff;
        buffer[offset + 1] = (value / 0x100) & 0xff;
        buffer[offset + 2] = value & 0xff;
    },

};
