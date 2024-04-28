'use strict';

const Atom = require('../../lib/mp4/atoms/atom-co64');
const BufferUtils = require('../../lib/buffer-utils');

const chai = require('chai');
const expect = chai.expect;

const Utils = require('../lib/utils');

describe('co64', function () {
    describe('#parse()', function () {
        it('should parse a well-built buffer', function () {
            let entries = [
                Utils.randInt(111111111111, 999999999999999),
                Utils.randInt(111111111111, 999999999999999),
                Utils.randInt(111111111111, 999999999999999),
            ];
            let buffer = Buffer.alloc(8 + 8 * entries.length);
            buffer.writeUInt32BE(entries.length, 4);
            for (let i = 0; i < entries.length; i++) {
                BufferUtils.writeUInt64BE(buffer, entries[i], 8 + 8 * i);
            }

            let atom = new Atom();
            atom.parse(buffer);

            expect(atom.entries).to.deep.equal(entries);
        });
    });

    describe('#build()', function () {
        it('should build a correct buffer', function () {
            let entries = [
                Utils.randInt(111111111111, 999999999999999),
                Utils.randInt(111111111111, 999999999999999),
                Utils.randInt(111111111111, 999999999999999),
            ];

            let atom = new Atom();
            atom.entries = entries;

            let buffer = Buffer.alloc(16 + 8 * entries.length);
            atom.build(buffer, 0);

            expect(buffer.readUInt32BE(0)).to.be.equal(buffer.length);
            expect(buffer.toString('ascii', 4, 8)).to.be.equal('co64');

            atom = new Atom();
            atom.parse(buffer.subarray(8));

            expect(atom.entries).to.deep.equal(entries);
        });
    });
});
