'use strict';

const Utils = require('./utils');
const BufferUtils = require('../buffer-utils');
const VideoSample = require('../video-sample');

class MovieIndexer {

    static index(movie, fragments) {
        let buffers = [];
        let buffersLength = 0;

        let videoTrack = movie.videoTrack();
        if (videoTrack === null) {
            throw new Error('Movie should have at least one video track');
        }
        let audioTrack = movie.audioTrack();

        // Build header
        let headerSize = Utils.HEADER_INFO_SIZE;
        if (null !== videoTrack && null !== videoTrack.extraData) {
            headerSize += videoTrack.extraData.length;
        }
        if (null !== audioTrack && null !== audioTrack.extraData) {
            headerSize += audioTrack.extraData.length;
        }
        let headerBuf = new Buffer(headerSize);
        let pos = 0;
        headerBuf[pos++] = Utils.CURRENT_INDEX_VERSION;
        headerBuf.writeUInt32BE(movie.timescale, pos);
        pos += 4;
        BufferUtils.writeUInt64BE(headerBuf, movie.duration, pos);
        pos += 8;
        BufferUtils.writeUInt64BE(headerBuf, movie.size(), pos);
        pos += 8;
        headerBuf.writeUInt16BE(videoTrack.width, pos);
        pos += 2;
        headerBuf.writeUInt16BE(videoTrack.height, pos);
        pos += 2;
        headerBuf.writeUInt32BE(fragments.length, pos);
        pos += 4;
        for (let track of [videoTrack, audioTrack]) {
            if (track !== null && track.extraData !== null) {
                headerBuf.writeUInt16BE(track.extraData.length, pos);
                pos += 2;
                track.extraData.copy(headerBuf, pos);
                pos += track.extraData.length;
            } else {
                headerBuf.writeUInt16BE(0, pos);
                pos += 2;
            }
        }

        buffers.push(headerBuf);
        buffersLength += headerBuf.length;

        // Fragments info
        let fragmentsBuf = new Buffer(Utils.FRAGMENT_INFO_SIZE * fragments.length);
        buffers.push(fragmentsBuf);
        buffersLength += fragmentsBuf.length;

        let samplesOffset = headerBuf.length + fragmentsBuf.length;

        let fPos = 0;
        for (let fragment of fragments) {
            let samplesBuf = Buffer(Utils.SAMPLE_INFO_SIZE * fragment.samples.length);
            for (let sample of fragment.samples) {
                let pos = 0;
                if (sample instanceof VideoSample) {
                    samplesBuf[pos++] = sample.keyframe ? Utils.TYPE_VIDEO_KEY : Utils.TYPE_VIDEO;
                    samplesBuf.writeUInt32BE(sample.compositionOffset, pos);
                } else {
                    samplesBuf[pos++] = Utils.TYPE_AUDIO;
                    samplesBuf.writeUInt32BE(0, pos);
                }
                pos += 4;
                samplesBuf.writeUInt32BE(sample.size, pos);
                pos += 4;
                BufferUtils.writeUInt64BE(samplesBuf, sample.offset, pos);
                pos += 8;
                BufferUtils.writeUInt64BE(samplesBuf, sample.timestamp, pos);
                pos += 8;
            }
            buffers.push(samplesBuf);
            buffersLength += samplesBuf.length;

            fragmentsBuf.writeUInt32BE(samplesOffset, fPos);
            fPos += 4;
            fragmentsBuf.writeUInt32BE(fragment.samples.length, fPos);
            fPos += 4;
            BufferUtils.writeUInt64BE(fragmentsBuf, fragment.timestamp, fPos);
            fPos += 8;
            BufferUtils.writeUInt64BE(fragmentsBuf, fragment.duration, fPos);
            fPos += 8;
        }

        return Buffer.concat(buffers, buffersLength);
    }

}

module.exports = MovieIndexer;
