'use strict';

const VideoLib = require('../index');
const MovieParser = VideoLib.MovieParser;
const FragmentListBuilder = VideoLib.FragmentListBuilder;
const DASHPacketizer = VideoLib.DASHPacketizer;

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const MOVIE_FILE = './resources/boomstream.mp4';

const shouldBeValidIndex = function (type) {
    describe('when fragment list is valid', function () {
        it('should return a buffer object', function () {
            let buffer = DASHPacketizer[`${type}Index`](this.fragmentList);
            fs.writeFileSync(`${type}-init.m4s`, buffer);
            return expect(buffer).to.be.instanceof(Buffer);
        });
    });

    describe('when fragment list is not valid', function () {
        it('should throws an error', function () {
            return expect(() => DASHPacketizer[`${type}Index`]('Some string')).to.throw('Argument 1 should be instance of FragmentList');
        });
    });
};

describe('DASHPacketizer', function () {

    before(function () {
        this.file = fs.openSync(MOVIE_FILE, 'r');
        this.movie = MovieParser.parse(this.file);
        this.fragmentList = FragmentListBuilder.build(this.movie, 5);
    });

    after(function () {
        fs.closeSync(this.file);
    });

    describe('videoIndex()', function () {
        shouldBeValidIndex('video');
    });

    describe('audioIndex()', function () {
        shouldBeValidIndex('audio');
    });

});
