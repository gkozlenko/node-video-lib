'use strict';

const BufferUtils = require('../lib/buffer-utils');

const chai = require('chai');
const faker = require('faker');
const expect = chai.expect;

describe('BufferUtils', function () {

    describe('64-bit integers', function () {
        it('should write and read ordinary integers', function () {
            let buffer = Buffer.allocUnsafe(8);
            let number = faker.random.number();
            BufferUtils.writeInt64BE(buffer, number, 0);
            expect(BufferUtils.readInt64BE(buffer, 0)).to.be.equal(number);
        });

        it('should write and read long integers', function () {
            let buffer = Buffer.allocUnsafe(8);
            let number = faker.random.number({min: 111111111111, max: 999999999999999});
            BufferUtils.writeInt64BE(buffer, number, 0);
            expect(BufferUtils.readInt64BE(buffer, 0)).to.be.equal(number);
        });
    });

});
