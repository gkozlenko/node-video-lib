'use strict';

const VideoLib = require('../index');
const MP4Parser = VideoLib.MP4Parser;
const MovieIndexer = VideoLib.MovieIndexer;
const Utils = require('../lib/index/utils');

const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const MP4_FILE = './resources/boomstream.mp4';

describe('MovieIndexer', function() {

    describe('#index()', function() {
        before(function() {
            this.file = fs.openSync(MP4_FILE, 'r');
            this.movie = MP4Parser.parse(this.file);
            this.fragments = this.movie.fragments(5);
        });

        after(function() {
            fs.closeSync(this.file);
        });

        it('should return a buffer object', function() {
            return expect(MovieIndexer.index(this.movie, this.fragments)).to.be.instanceof(Buffer);
        });

        it('should have right size', function() {
            let size = Utils.HEADER_INFO_SIZE;
            let videoTrack = this.movie.videoTrack();
            let audioTrack = this.movie.audioTrack();
            if (videoTrack !== null && videoTrack.extraData !== null) {
                size += videoTrack.extraData.length;
            }
            if (audioTrack !== null && audioTrack.extraData !== null) {
                size += audioTrack.extraData.length;
            }
            size += this.fragments.length * Utils.FRAGMENT_INFO_SIZE;
            for (let fragment of this.fragments) {
                size += fragment.samples.length * Utils.SAMPLE_INFO_SIZE;
            }
            return expect(MovieIndexer.index(this.movie, this.fragments).length).to.be.eq(size);
        });
    });

});
