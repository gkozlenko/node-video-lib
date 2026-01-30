'use strict';

const CodecAac = require('../../lib/codecs/codec-aac');

const chai = require('chai');
const expect = chai.expect;

describe('AAC', function () {

    describe('#parse', function () {
        it('should throw an error when extraData is not privided', () => {
            const codec = new CodecAac(null);
            expect(() => codec.parse()).to.throw('Invalid AAC config: data too short (0 bytes)');
        });

        it('should throw an error when extraData is too short', () => {
            const extraData = Buffer.from([0x00]);
            const codec = new CodecAac(extraData);
            expect(() => codec.parse()).to.throw('Invalid AAC config: data too short (1 bytes)');
        });
    });

    describe('#codec', function () {
        it('should correctly identify AAC LC (Profile 2)', () => {
            const extraData = Buffer.from([0x10, 0x00]);
            const codec = new CodecAac(extraData);
            expect(codec.codec()).to.equal('mp4a.40.2');
        });

        it('should correctly identify AAC Main (Profile 1)', () => {
            const extraData = Buffer.from([0x08, 0x00]);
            const codec = new CodecAac(extraData);
            expect(codec.codec()).to.equal('mp4a.40.1');
        });

        it('should correctly identify HE-AAC (Profile 5)', () => {
            const extraData = Buffer.from([0x28, 0x00]);
            const codec = new CodecAac(extraData);
            expect(codec.codec()).to.equal('mp4a.40.5');
        });

        it('should ignore Frequency Index bits (lower 3 bits)', () => {
            const extraData = Buffer.from([0x14, 0x00]);
            const codec = new CodecAac(extraData);
            expect(codec.codec()).to.equal('mp4a.40.2');
        });

        it('should handle Profile 31 (Max 5 bit value)', () => {
            const extraData = Buffer.from([0xf8, 0x00]);
            const codec = new CodecAac(extraData);
            expect(codec.codec()).to.equal('mp4a.40.31');
        });
    });

});
