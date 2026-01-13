'use strict';

const VideoLib = require('../index');
const FragmentReader = VideoLib.FragmentReader;
const MockReader = require('./lib/mock-reader');

const chai = require('chai');
const expect = chai.expect;

describe('FragmentReader', function () {

    describe('#readSamples()', function () {
        it('should return empty array when fragment does not have samples', function () {
            let fragment = { samples: [] };
            expect(FragmentReader.readSamples(fragment, null)).to.deep.equal([]);
        });

        it('should read only once', function () {
            let fragment = {
                samples: [
                    { offset: 1000, size: 900 },
                    { offset: 4000, size: 960 },
                    { offset: 2000, size: 920 },
                    { offset: 5000, size: 1000 },
                    { offset: 3000, size: 940 },
                ],
            };
            let reader = new MockReader();
            let buffers = FragmentReader.readSamples(fragment, reader);

            expect(buffers.map(b => b.length)).to.deep.equal([900, 960, 920, 1000, 940]);
            expect(reader.calls).to.deep.equal([{ offset: 1000, size: 5000 }]);
        });

        it('should split reads in case of gap', function () {
            let fragment = {
                samples: [
                    { offset: 9000, size: 500 },
                    { offset: 2000, size: 600 },
                    { offset: 8000, size: 700 },
                    { offset: 1000, size: 800 },
                ],
            };
            let reader = new MockReader();
            let buffers = FragmentReader.readSamples(fragment, reader);

            expect(buffers.map(b => b.length)).to.deep.equal([500, 600, 700, 800]);
            expect(reader.calls).to.deep.equal([{ offset: 1000, size: 1600 }, { offset: 8000, size: 1500 }]);
        });

        it('should split reads in case of continuous chunks', function () {
            let fragment = {
                samples: [
                    { offset: 0, size: 500000 },
                    { offset: 500000, size: 10000 },
                    { offset: 510000, size: 50000 },
                ],
            };
            let reader = new MockReader();
            let buffers = FragmentReader.readSamples(fragment, reader);

            expect(buffers.map(b => b.length)).to.deep.equal([500000, 10000, 50000]);
            expect(reader.calls).to.deep.equal([{ offset: 0, size: 510000 }, { offset: 510000, size: 50000 }]);
        });

        it('should split reads in case of sparse data', function () {
            let fragment = {
                samples: [
                    { offset: 0, size: 10000 },
                    { offset: 530000, size: 16000 },
                    { offset: 550000, size: 10000 },
                ],
            };
            let reader = new MockReader();
            let buffers = FragmentReader.readSamples(fragment, reader);

            expect(buffers.map(b => b.length)).to.deep.equal([10000, 16000, 10000]);
            expect(reader.calls).to.deep.equal([{ offset: 0, size: 10000 }, { offset: 530000, size: 30000 }]);
        });

        it('should split reads in case of big chunks', function () {
            let fragment = {
                samples: [
                    { offset: 0, size: 1000000 },
                    { offset: 1000000, size: 1000000 },
                ],
            };
            let reader = new MockReader();
            let buffers = FragmentReader.readSamples(fragment, reader);

            expect(buffers.map(b => b.length)).to.deep.equal([1000000, 1000000]);
            expect(reader.calls).to.deep.equal([{ offset: 0, size: 1000000 }, { offset: 1000000, size: 1000000 }]);
        });
    });

});
