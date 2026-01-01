'use strict';

const crc32 = require('../../lib/hls/crc32');

const chai = require('chai');
const expect = chai.expect;

describe('CRC-32/MPEG-2', function () {

    it('should pass standard check', function () {
        const buffer = Buffer.from('123456789', 'ascii');
        const expected = 0x0376E6E7;
        expect(crc32.checksum(buffer, 0, buffer.length)).to.be.equal(expected);
    });

    it('should take into account offset and length logic', function () {
        const buffer = Buffer.alloc(20);
        buffer.fill(0xFF);
        const payload = Buffer.from('123456789', 'ascii');
        payload.copy(buffer, 5);
        const expected = 0x0376E6E7;
        expect(crc32.checksum(buffer, 5, 5 + payload.length)).to.be.equal(expected);
    });

    it('shuld pass zero residue property validation', function () {
        const data = Buffer.from('TestingMPEG2', 'ascii');
        const checksum = crc32.checksum(data, 0, data.length);

        const fullBuffer = Buffer.alloc(data.length + 4);
        data.copy(fullBuffer, 0);
        fullBuffer.writeUInt32BE(checksum, data.length);

        const residue = crc32.checksum(fullBuffer, 0, fullBuffer.length);
        expect(residue).to.be.equal(0);
    });

});
