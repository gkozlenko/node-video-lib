'use strict';

const BufferUtils = require('../lib/buffer-utils');

const chai = require('chai');
const faker = require('faker');
const expect = chai.expect;

describe('BufferUtils', function () {

    describe('64-bit integers', function () {
        it('should write and read ordinary integers', function () {
            let buffer = Buffer.allocUnsafe(8);
            let number = faker.datatype.number();
            BufferUtils.writeUInt64BE(buffer, number, 0);
            expect(BufferUtils.readUInt64BE(buffer, 0)).to.be.equal(number);
        });

        it('should write and read long integers', function () {
            let buffer = Buffer.allocUnsafe(8);
            let number = faker.datatype.number({min: 111111111111, max: 999999999999999});
            BufferUtils.writeUInt64BE(buffer, number, 0);
            expect(BufferUtils.readUInt64BE(buffer, 0)).to.be.equal(number);
        });

        it('should write and read boundary values', function () {
            let buffer = Buffer.allocUnsafe(8);
            let numbers = [0xFFFFFFFF - 2, 0xFFFFFFFF - 1, 0xFFFFFFFF, 0xFFFFFFFF + 1, 0xFFFFFFFF + 2];
            for (let number of numbers) {
                BufferUtils.writeUInt64BE(buffer, number, 0);
                expect(BufferUtils.readUInt64BE(buffer, 0)).to.be.equal(number);
            }
        });
    });

});
