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

module.exports = {
    tempFile: tempFile,
    randInt: randInt,
};
