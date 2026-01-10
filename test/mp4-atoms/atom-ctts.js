'use strict';

const Atom = require('../../lib/mp4/atoms/atom-ctts');

const chai = require('chai');
const expect = chai.expect;

const Utils = require('../lib/utils');

describe('ctts', function () {
    describe('#parse()', function () {
        it('should parse a well-built buffer with different entries', function () {
            let entries = [
                Utils.randInt(1, 1000),
                Utils.randInt(-200000, -1),
                Utils.randInt(1, 1000),
                Utils.randInt(1, 2000000),
            ];
            let buffer = Buffer.alloc(8 + 4 * entries.length);
            buffer.writeUInt32BE(entries.length / 2, 4);
            for (let i = 0; i < entries.length; i++) {
                buffer.writeInt32BE(entries[i], 8 + 4 * i);
            }

            let atom = new Atom();
            atom.parse(buffer);

            expect(atom.entries).to.deep.equal(entries);
        });
    });

    describe('#build()', function () {
        it('should build a correct buffer', function () {
            let entries = [
                Utils.randInt(1, 1000),
                Utils.randInt(-200000, -1),
                Utils.randInt(1, 1000),
                Utils.randInt(1, 2000000),
            ];

            let atom = new Atom();
            atom.entries = entries;

            let buffer = Buffer.alloc(16 + 4 * entries.length);
            atom.build(buffer, 0);

            expect(buffer.readUInt32BE(0)).to.be.equal(buffer.length);
            expect(buffer.toString('ascii', 4, 8)).to.be.equal('ctts');

            atom = new Atom();
            atom.parse(buffer.subarray(8));

            expect(atom.entries).to.deep.equal(entries);
        });
    });
});
