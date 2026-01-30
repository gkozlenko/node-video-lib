'use strict';

const CodecH265 = require('../../lib/codecs/codec-h265');

const chai = require('chai');
const expect = chai.expect;

describe('H265', function () {

    describe('#parse', function () {
        it('should throw an error when extraData is not privided', () => {
            const codec = new CodecH265(null);
            expect(() => codec.parse()).to.throw('Invalid H.265 config: data too short (0 bytes)');
        });

        it('should throw an error when extraData is too short', () => {
            const extraData = Buffer.alloc(22);
            const codec = new CodecH265(extraData);
            expect(() => codec.parse()).to.throw('Invalid H.265 config: data too short (22 bytes)');
        });

        it('should throw an error when invalid version', () => {
            const extraData = Buffer.alloc(23);
            const codec = new CodecH265(extraData);
            expect(() => codec.parse()).to.throw('Invalid H.265 config version: 0');
        });

        it('should throw an error when NAL unit size is not supported', () => {
            const extraData = Buffer.alloc(23);
            extraData[0] = 0x01; // version
            extraData[21] = 0x01; // lengthSizeMinusOne
            const codec = new CodecH265(extraData);
            expect(() => codec.parse()).to.throw('Unsupported H.265 NAL unit length size: 2 (only 4 bytes supported)');
        });
    });

    describe('#codec', function () {
        it('should correctly parse standard Main Profile HEVC string', () => {
            const extraData = Buffer.alloc(23);
            extraData[0] = 0x01; // version
            extraData[1] = 0x01; // profile indication
            extraData.writeUInt32BE(0x60000000, 2); // general profile compatibility flags
            // general constraint flags
            extraData[6] = 0x90;
            extraData[7] = 0x00;
            extraData[12] = 93; // level

            const codec = new CodecH265(extraData);
            expect(codec.codec()).to.equal('hvc1.1.60000000.L93.9');
        });

        it('should correctly handle High Tier and Profile Space', () => {
            const extraData = Buffer.alloc(23);
            extraData[0] = 0x01; // version
            extraData[1] = 0x62; // profile indication
            extraData.writeUInt32BE(0x00000001, 2); // general profile compatibility flags
            extraData[12] = 120; // level

            const codec = new CodecH265(extraData);
            expect(codec.codec()).to.equal('hvc1.A2.1.H120');
        });
    });

});
