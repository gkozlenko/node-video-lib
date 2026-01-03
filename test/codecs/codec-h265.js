'use strict';

const CodecH265 = require('../../lib/codecs/codec-h265');

const chai = require('chai');
const expect = chai.expect;

describe('H265', function () {

    describe('#codec', function () {
        it('should correctly parse standard Main Profile HEVC string', function () {
            const buffer = Buffer.alloc(23);
            buffer[0] = 0x01; // version
            buffer[1] = 0x01; // profile indication
            buffer.writeUInt32BE(0x60000000, 2); // general profile compatibility flags
            // general constraint flags
            buffer[6] = 0x90;
            buffer[7] = 0x00;
            buffer[12] = 93; // level

            const codec = new CodecH265(buffer);
            expect(codec.codec()).to.equal('hvc1.1.60000000.L93.9');
        });

        it('should correctly handle High Tier and Profile Space', function () {
            const buffer = Buffer.alloc(23);
            buffer[0] = 0x01; // version
            buffer[1] = 0x62; // profile indication
            buffer.writeUInt32BE(0x00000001, 2); // general profile compatibility flags
            buffer[12] = 120; // level

            const codec = new CodecH265(buffer);
            expect(codec.codec()).to.equal('hvc1.A2.1.H120');
        });
    });

});
