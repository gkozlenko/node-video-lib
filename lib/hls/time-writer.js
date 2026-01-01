'use strict';

function writePtsDts(buffer, pos, time, base) {
    buffer[pos + 0] = (Math.floor(time / (1 << 29)) & 0x0e) | (base & 0xf0) | 0x1;
    buffer[pos + 1] = Math.floor(time / (1 << 22)) & 0xff;
    buffer[pos + 2] = (Math.floor(time / (1 << 14)) & 0xff) | 0x1;
    buffer[pos + 3] = Math.floor(time / (1 << 7)) & 0xff;
    buffer[pos + 4] = ((time << 1) & 0xff) | 0x1;
    return 5;
}

function writePcr(buffer, pos, time) {
    buffer[pos + 0] = Math.floor(time / (1 << 25)) & 0xff;
    buffer[pos + 1] = Math.floor(time / (1 << 17)) & 0xff;
    buffer[pos + 2] = Math.floor(time / (1 << 9)) & 0xff;
    buffer[pos + 3] = Math.floor(time / 2) & 0xff;
    buffer[pos + 4] = ((time & 0x1) << 7) | 0x7e;
    buffer[pos + 5] = 0;
    return 6;
}

module.exports = {
    writePtsDts,
    writePcr,
};
