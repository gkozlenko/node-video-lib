'use strict';

const Atom = require('../../lib/mp4/atoms/atom-mdhd');
const BufferUtils = require('../../lib/buffer-utils');

const chai = require('chai');
const expect = chai.expect;

const Utils = require('../lib/utils');

describe('mdhd', function () {
    describe('#parse()', function () {
        it('should parse a well-built buffer v0', function () {
            let timescale = Utils.randInt();
            let duration = Utils.randInt();

            let buffer = Buffer.alloc(24);
            buffer[0] = 0;
            buffer.writeUInt32BE(timescale, 12);
            buffer.writeUInt32BE(duration, 16);

            let atom = new Atom();
            atom.parse(buffer);

            expect(atom.timescale).to.be.equal(timescale);
            expect(atom.duration).to.be.equal(duration);
        });

        it('should parse a well-built buffer v1', function () {
            let timescale = Utils.randInt();
            let duration = Utils.randInt() + 2147483647;

            let buffer = Buffer.alloc(36);
            buffer[0] = 1;
            buffer.writeUInt32BE(timescale, 20);
            BufferUtils.writeUInt64BE(buffer, duration, 24);

            let atom = new Atom();
            atom.parse(buffer);

            expect(atom.timescale).to.be.equal(timescale);
            expect(atom.duration).to.be.equal(duration);
        });
    });

    describe('#build()', function () {
        it('should build a correct buffer v0', function () {
            let timescale = Utils.randInt();
            let duration = Utils.randInt();

            let atom = new Atom();
            atom.timescale = timescale;
            atom.duration = duration;

            let buffer = Buffer.alloc(32);
            atom.build(buffer, 0);

            expect(buffer.readUInt32BE(0)).to.be.equal(buffer.length);
            expect(buffer.toString('ascii', 4, 8)).to.be.equal('mdhd');
            expect(buffer[8]).to.be.equal(0);
            expect(buffer.readUInt32BE(20)).to.be.equal(timescale);
            expect(buffer.readUInt32BE(24)).to.be.equal(duration);

            atom = new Atom();
            atom.parse(buffer.subarray(8));

            expect(atom.timescale).to.be.equal(timescale);
            expect(atom.duration).to.be.equal(duration);
        });

        it('should build a correct buffer v1', function () {
            let timescale = Utils.randInt();
            let duration = Utils.randInt() + 2147483647;

            let atom = new Atom();
            atom.timescale = timescale;
            atom.duration = duration;

            let buffer = Buffer.alloc(44);
            atom.build(buffer, 0);

            expect(buffer.readUInt32BE(0)).to.be.equal(buffer.length);
            expect(buffer.toString('ascii', 4, 8)).to.be.equal('mdhd');
            expect(buffer[8]).to.be.equal(1);
            expect(buffer.readUInt32BE(28)).to.be.equal(timescale);
            expect(BufferUtils.readUInt64BE(buffer, 32)).to.be.equal(duration);

            atom = new Atom();
            atom.parse(buffer.subarray(8));

            expect(atom.timescale).to.be.equal(timescale);
            expect(atom.duration).to.be.equal(duration);
        });
    });

});
