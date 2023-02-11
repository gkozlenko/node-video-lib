'use strict';

const os = require('os');
const path = require('path');

function tempFile(ext) {
    let parts = [Date.now(), '-', Math.floor(10000000 * Math.random()), '.', ext];
    return path.join(os.tmpdir(), parts.join(''));
}

function randInt(min, max) {
    min = min || 0;
    max = max || 2147483647; // max 32 bit integer
    return min + Math.floor(Math.random() * (max - min));
}

function randString(size) {
    size = size || 0;
    let chars = new Array(size);
    for (let i = 0; i < size; i++) {
        chars[i] = Math.random().toString(36)[2];
    }
    return chars.join('');
}

module.exports = {
    tempFile: tempFile,
    randInt: randInt,
    randString: randString,
};
