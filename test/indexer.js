'use strict';

const VideoLib = require('../index');
const MP4Parser = VideoLib.MP4Parser;
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const FragmentListIndexer = VideoLib.FragmentListIndexer;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const MP4_FILE = './resources/boomstream.mp4';

describe('FragmentListIndexer', function() {
    before(function() {
        this.file = fs.openSync(MP4_FILE, 'r');
        this.movie = MP4Parser.parse(this.file);
    });

    after(function() {
        fs.closeSync(this.file);
    });

    describe('#index()', function() {
        describe('when fragment list is valid', function() {
            before(function() {
                this.fragmentList = FragmentListBuilder.build(this.movie, 5);
            });

            it('should return a buffer object', function() {
                return expect(FragmentListIndexer.index(this.fragmentList)).to.be.instanceof(Buffer);
            });
        });

        describe('when fragment list is not valid', function() {
            it('should throws an error', function() {
                return expect(() => FragmentListIndexer.index('Some string')).to.throw('Argument 1 should be instance of FragmentList');
            });
        });
    });

});
