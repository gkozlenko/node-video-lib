'use strict';

var MP4Parser = require('../index');

var fs = require('fs');
var http = require('http');
var shortid = require('shortid');
var Promise = require('bluebird');

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;

var TEST_FILE = 'http://s3-eu-west-1.amazonaws.com/hwdmedia-resources/boomstream.mp4';

var tmpFile = null;
var movie = null;

tmpFile = '/tmp/ByuvCbXa.mp4';

describe('node-mp4-parser', function () {
    this.timeout(10000);

    // before(function() {
    //     // Download file
    //     return new Promise(function(resolve) {
    //         tmpFile = '/tmp/' + shortid.generate() + '.mp4';
    //         var file = fs.createWriteStream(tmpFile);
    //         http.get(TEST_FILE, function(response) {
    //             response.pipe(file).on('close', function() {
    //                 resolve();
    //             });
    //         });
    //     });
    // });
    //
    // after(function() {
    //     // Delete file
    //     if (tmpFile !== null) {
    //         return new Promise(function(resolve) {
    //             fs.unlink(tmpFile, function() {
    //                 resolve();
    //             });
    //         });
    //     }
    // });

    describe('parse', function () {

        it('should throw an error when opens a non existing file', function () {
            return expect(MP4Parser.parse('/file/not/exists.mp4')).to.be.rejected;
        });

        it('should not throw an error when opens an existing file', function () {
            return expect(MP4Parser.parse(tmpFile)).to.be.fulfilled;
        });

    });

    describe('length', function () {

        beforeEach(function() {
            return MP4Parser.parse(tmpFile).then(function(data) {
                movie = data;
            });
        });

        afterEach(function() {
            return movie.close();
        });

        it('should return the right file length', function () {
            return expect(movie.size).to.equal(fs.statSync(tmpFile)['size']);
        });

    });

});
