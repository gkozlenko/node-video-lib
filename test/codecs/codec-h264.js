'use strict';

const CodecH264 = require('../../lib/codecs/codec-h264');

const chai = require('chai');
const expect = chai.expect;

describe('H264', function () {

    describe('#codec', function () {
        it('should correctly parse Main Profile (Level 4.1)', function () {
            const extraData = Buffer.from([0x01, 0x4d, 0x40, 0x29, 0xff]);
            const codec = new CodecH264(extraData);
            expect(codec.codec()).to.equal('avc1.4d4029');
        });

        it('should correctly parse High Profile (Level 5.1)', () => {
            const extraData = Buffer.from([0x01, 0x64, 0x00, 0x33, 0xff]);
            const codec = new CodecH264(extraData);
            expect(codec.codec()).to.equal('avc1.640033');
        });

        it('should apply zero-padding for single digit hex values', () => {
            const extraData = Buffer.from([0x01, 0x42, 0xe0, 0x0a, 0xff]);
            const codec = new CodecH264(extraData);
            expect(codec.codec()).to.equal('avc1.42e00a');
        });

        it('should handle zero bytes correctly', () => {
            const extraData = Buffer.from([0x01, 0x00, 0x00, 0x00, 0xff]);
            const codec = new CodecH264(extraData);
            expect(codec.codec()).to.equal('avc1.000000');
        });

        it('should handle max byte values (0xFF)', () => {
            const extraData = Buffer.from([0x01, 0xff, 0xff, 0xff, 0xff]);
            const codec = new CodecH264(extraData);
            expect(codec.codec()).to.equal('avc1.ffffff');
        });
    });

});
