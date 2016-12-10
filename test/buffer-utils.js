'use strict';

const BufferUtils = require('../lib/buffer-utils');

const chai = require('chai');
const faker = require('faker');
const expect = chai.expect;

describe('BufferUtils', function() {

    it('should write and read ordinary integers', function() {
        let buffer = new Buffer(8);
        let number = faker.random.number();
        BufferUtils.writeUInt64BE(buffer, number, 0);
        expect(BufferUtils.readUInt64BE(buffer, 0)).to.be.equal(number);
    });

    it('should write and read long integers', function() {
        let buffer = new Buffer(8);
        let number = faker.random.number({min: 111111111111, max: 999999999999999});
        BufferUtils.writeUInt64BE(buffer, number, 0);
        expect(BufferUtils.readUInt64BE(buffer, 0)).to.be.equal(number);
    });

});
