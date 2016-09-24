'use strict';

var MP4Parser = require('../index');

var fs = require('fs');
var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;

var TEST_FILE = './resources/boomstream.mp4';

var movie = null;

describe('node-mp4-parser', function () {
    this.timeout(10000);

    describe('parse', function () {

        it('should throw an error when opens a non existing file', function () {
            return expect(MP4Parser.parse('/file/not/exists.mp4')).to.be.rejected;
        });

        it('should not throw an error when opens an existing file', function () {
            return expect(MP4Parser.parse(TEST_FILE)).to.be.fulfilled;
        });

    });

    describe('length', function () {

        beforeEach(function() {
            return MP4Parser.parse(TEST_FILE).then(function(data) {
                movie = data;
            });
        });

        afterEach(function() {
            return movie.close();
        });

        it('should return the right file length', function () {
            return expect(movie.size).to.equal(fs.statSync(TEST_FILE)['size']);
        });

    });

});
