'use strict';

const Atom = require('../../lib/mp4/atoms/atom-hdlr');

const chai = require('chai');
const expect = chai.expect;

const Utils = require('../lib/utils');

describe('hdlr', function () {
    describe('#parse()', function () {
        it('should parse a well-built buffer', function () {
            let handlerType = Utils.randString(4);
            for (let i = 0; i <= 13; i++) {
                let componentName = Utils.randString(i);

                let buffer = Buffer.alloc(37);
                buffer.write(handlerType, 8);
                buffer.write(componentName, 24);

                let atom = new Atom();
                atom.parse(buffer);

                expect(atom.handlerType).to.be.equal(handlerType);
                expect(atom.componentName).to.be.equal(componentName);
            }
        });
    });

    describe('#build()', function () {
        it('should build a correct buffer', function () {
            let handlerType = Utils.randString(4);
            let componentName = Utils.randString(12);

            let atom = new Atom();
            atom.handlerType = handlerType;
            atom.componentName = componentName;

            let buffer = Buffer.alloc(45);
            atom.build(buffer, 0);

            expect(buffer.readUInt32BE(0)).to.be.equal(buffer.length);
            expect(buffer.toString('ascii', 4, 8)).to.be.equal('hdlr');
            expect(buffer.toString('ascii', 16, 20)).to.be.equal(handlerType);
            expect(buffer.toString('ascii', 32, 44)).to.be.equal(componentName);

            atom = new Atom();
            atom.parse(buffer.subarray(8));

            expect(atom.handlerType).to.be.equal(handlerType);
            expect(atom.componentName).to.be.equal(componentName);
        });
    });

});
