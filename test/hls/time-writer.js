'use strict';

const TimeWriter = require('../../lib/hls/time-writer');

const chai = require('chai');
const expect = chai.expect;

describe('TimeWriter', function () {

    describe('#writePtsDts', function () {
        it('should write zero time correctly', function () {
            const buffer = Buffer.alloc(5);
            const bytes = TimeWriter.writePtsDts(buffer, 0, 0, 0x20);
            expect(buffer).to.deep.equal(Buffer.from([0x21, 0x00, 0x01, 0x00, 0x01]));
            expect(bytes).to.be.equal(5);
        });

        it('should take into account offset logic', function () {
            const buffer = Buffer.alloc(7);
            const bytes = TimeWriter.writePtsDts(buffer, 1, 0, 0x30);
            expect(buffer).to.deep.equal(Buffer.from([0x00, 0x31, 0x00, 0x01, 0x00, 0x01, 0x00]));
            expect(bytes).to.be.equal(5);
        });

        it('should write 1 hour timestamp correctly', function () {
            const buffer = Buffer.alloc(5);
            const time = 324000000;
            const results = [
                [0x10, [0x11, 0x4d, 0x3f, 0xb2, 0x01]],
                [0x20, [0x21, 0x4d, 0x3f, 0xb2, 0x01]],
                [0x30, [0x31, 0x4d, 0x3f, 0xb2, 0x01]],
            ];
            for (const item of results) {
                const bytes = TimeWriter.writePtsDts(buffer, 0, time, item[0]);
                expect(buffer).to.deep.equal(Buffer.from(item[1]));
                expect(bytes).to.be.equal(5);
            }
        });

        it('should write ~6.5 hours timestamp correctly', function () {
            const buffer = Buffer.alloc(5);
            const time = 2106123457;
            const results = [
                [0x10, [0x13, 0xf6, 0x23, 0xc9, 0x83]],
                [0x20, [0x23, 0xf6, 0x23, 0xc9, 0x83]],
                [0x30, [0x33, 0xf6, 0x23, 0xc9, 0x83]],
            ];
            for (const item of results) {
                const bytes = TimeWriter.writePtsDts(buffer, 0, time, item[0]);
                expect(buffer).to.deep.equal(Buffer.from(item[1]));
                expect(bytes).to.be.equal(5);
            }
        });

        it('should write ~24 hours timestamp correctly', function () {
            const buffer = Buffer.alloc(5);
            const time = 7776123457;
            const results = [
                [0x10, [0x1f, 0x3d, 0xf9, 0x74, 0x83]],
                [0x20, [0x2f, 0x3d, 0xf9, 0x74, 0x83]],
                [0x30, [0x3f, 0x3d, 0xf9, 0x74, 0x83]],
            ];
            for (const item of results) {
                const bytes = TimeWriter.writePtsDts(buffer, 0, time, item[0]);
                expect(buffer).to.deep.equal(Buffer.from(item[1]));
                expect(bytes).to.be.equal(5);
            }
        });
    });

    describe('#writePcr', function () {
        it('should write zero time correctly', function () {
            const buffer = Buffer.alloc(6);
            const bytes = TimeWriter.writePcr(buffer, 0, 0);
            expect(buffer).to.deep.equal(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x7e, 0x00]));
            expect(bytes).to.be.equal(6);
        });

        it('should take into account offset logic', function () {
            const buffer = Buffer.alloc(8);
            const bytes = TimeWriter.writePcr(buffer, 1, 0);
            expect(buffer).to.deep.equal(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x7e, 0x00, 0x00]));
            expect(bytes).to.be.equal(6);
        });

        it('should write 1 hour timestamp correctly', function () {
            const buffer = Buffer.alloc(6);
            const time = 324000000;
            const bytes = TimeWriter.writePcr(buffer, 0, time);
            expect(buffer).to.deep.equal(Buffer.from([0x09, 0xa7, 0xec, 0x80, 0x7e, 0x00]));
            expect(bytes).to.be.equal(6);
        });

        it('should write ~6.5 hours timestamp correctly', function () {
            const buffer = Buffer.alloc(6);
            const time = 2106123457;
            const bytes = TimeWriter.writePcr(buffer, 0, time);
            expect(buffer).to.deep.equal(Buffer.from([0x3e, 0xc4, 0x72, 0x60, 0xfe, 0x00]));
            expect(bytes).to.be.equal(6);
        });

        it('should write ~24 hours timestamp correctly', function () {
            const buffer = Buffer.alloc(6);
            const time = 7776123457;
            const bytes = TimeWriter.writePcr(buffer, 0, time);
            expect(buffer).to.deep.equal(Buffer.from([0xe7, 0xbf, 0x1d, 0x20, 0xfe, 0x00]));
            expect(bytes).to.be.equal(6);
        });
    });

});
