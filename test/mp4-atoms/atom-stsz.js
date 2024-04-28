'use strict';

const Atom = require('../../lib/mp4/atoms/atom-stsz');

const chai = require('chai');
const expect = chai.expect;

const Utils = require('../lib/utils');

describe('stsz', function () {
    describe('#parse()', function () {
        it('should parse a well-built buffer with different entries', function () {
            let entries = [
                Utils.randInt(),
                Utils.randInt(),
                Utils.randInt(),
            ];
            let buffer = Buffer.alloc(12 + 4 * entries.length);
            buffer.writeUInt32BE(0, 4);
            buffer.writeUInt32BE(entries.length, 8);
            for (let i = 0; i < entries.length; i++) {
                buffer.writeUInt32BE(entries[i], 12 + 4 * i);
            }

            let atom = new Atom();
            atom.parse(buffer);

            expect(atom.entries).to.deep.equal(entries);
        });

        it('should parse a well-built buffer with identical entries', function () {
            let value = Utils.randInt();
            let entries = [
                value,
                value,
                value,
            ];
            let buffer = Buffer.alloc(12);
            buffer.writeUInt32BE(value, 4);
            buffer.writeUInt32BE(entries.length, 8);

            let atom = new Atom();
            atom.parse(buffer);

            expect(atom.entries).to.deep.equal(entries);
        });
    });

    describe('#build()', function () {
        it('should build a correct buffer', function () {
            let entries = [
                Utils.randInt(),
                Utils.randInt(),
                Utils.randInt(),
            ];

            let atom = new Atom();
            atom.entries = entries;

            let buffer = Buffer.alloc(20 + 4 * entries.length);
            atom.build(buffer, 0);

            expect(buffer.readUInt32BE(0)).to.be.equal(buffer.length);
            expect(buffer.toString('ascii', 4, 8)).to.be.equal('stsz');

            atom = new Atom();
            atom.parse(buffer.subarray(8));

            expect(atom.entries).to.deep.equal(entries);
        });
    });
});
