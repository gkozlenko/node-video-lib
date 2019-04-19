'use strict';

const fs = require('fs');

const Utils = require('./utils');
const BufferUtils = require('../buffer-utils');
const VideoSample = require('../video-sample');
const IndexedFragmentList = require('./indexed-fragment-list');

class FragmentListIndexer {

    static index(fragmentList, fd) {
        // Calc buffer size and offsets
        let bufferSize = Utils.HEADER_SIZE;
        if (fragmentList.video) {
            bufferSize += fragmentList.video.extraData.length + Utils.HEADER_VIDEO_SIZE;
            if (fragmentList.video.codec) {
                bufferSize += fragmentList.video.codec.length;
            }
        }
        if (fragmentList.audio) {
            bufferSize += fragmentList.audio.extraData.length + Utils.HEADER_AUDIO_SIZE;
            if (fragmentList.audio.codec) {
                bufferSize += fragmentList.audio.codec.length;
            }
        }
        let fragmentsOffset = bufferSize;
        bufferSize += Utils.FRAGMENT_SIZE * fragmentList.fragments.length;
        let samplesOffset = bufferSize;
        for (let i = 0, len = fragmentList.fragments.length; i < len; i++) {
            bufferSize += Utils.SAMPLE_SIZE * fragmentList.fragments[i].samples.length;
        }
        let buffer = Buffer.allocUnsafe(bufferSize);

        // Write header
        let pos = 0;
        buffer.write(Utils.INDEX_PREFIX, pos); pos += 3;
        buffer[pos++] = Utils.INDEX_VERSION;
        buffer.writeUInt32BE(fragmentsOffset, pos); pos += 4;
        buffer.writeUInt32BE(fragmentList.fragments.length, pos); pos += 4;
        buffer.writeUInt32BE(fragmentList.fragmentDuration, pos); pos += 4;
        BufferUtils.writeUInt64BE(buffer, fragmentList.duration, pos); pos += 8;
        buffer.writeUInt32BE(fragmentList.timescale, pos); pos += 4;
        if (fragmentList.video) {
            buffer.writeUInt16BE(fragmentList.video.extraData.length, pos); pos += 2;
            fragmentList.video.extraData.copy(buffer, pos); pos += fragmentList.video.extraData.length;
            if (fragmentList.video.codec) {
                buffer.writeUInt16BE(fragmentList.video.codec.length, pos); pos += 2;
                buffer.write(fragmentList.video.codec, pos); pos += fragmentList.video.codec.length;
            } else {
                buffer.writeUInt16BE(0, pos); pos += 2;
            }
            buffer.writeUInt32BE(fragmentList.video.timescale, pos); pos += 4;
            buffer.writeUInt32BE(fragmentList.video.duration, pos); pos += 4;
            BufferUtils.writeUInt64BE(buffer, fragmentList.video.size, pos); pos += 8;
            buffer.writeUInt32BE(fragmentList.video.width, pos); pos += 4;
            buffer.writeUInt32BE(fragmentList.video.height, pos); pos += 4;
        } else {
            buffer.writeUInt16BE(0, pos); pos += 2;
        }
        if (fragmentList.audio) {
            buffer.writeUInt16BE(fragmentList.audio.extraData.length, pos); pos += 2;
            fragmentList.audio.extraData.copy(buffer, pos); pos += fragmentList.audio.extraData.length;
            if (fragmentList.audio.codec) {
                buffer.writeUInt16BE(fragmentList.audio.codec.length, pos); pos += 2;
                buffer.write(fragmentList.audio.codec, pos); pos += fragmentList.audio.codec.length;
            } else {
                buffer.writeUInt16BE(0, pos); pos += 2;
            }
            buffer.writeUInt32BE(fragmentList.audio.timescale, pos); pos += 4;
            buffer.writeUInt32BE(fragmentList.audio.duration, pos); pos += 4;
            BufferUtils.writeUInt64BE(buffer, fragmentList.audio.size, pos); pos += 8;
        } else {
            buffer.writeUInt16BE(0, pos); pos += 2;
        }

        // Write fragments
        for (let i = 0, fLen = fragmentList.fragments.length; i < fLen; i++) {
            let fragment = fragmentList.fragments[i];
            buffer.writeUInt32BE(fragment.samples.length, pos); pos += 4;
            buffer.writeUInt32BE(samplesOffset, pos); pos += 4;
            BufferUtils.writeUInt64BE(buffer, fragment.timestamp, pos); pos += 8;
            BufferUtils.writeUInt64BE(buffer, fragment.duration, pos); pos += 8;
            // Write samples
            for (let j = 0, sLen = fragment.samples.length; j < sLen; j++) {
                let sample = fragment.samples[j];
                buffer[samplesOffset++] = sample instanceof VideoSample ? (sample.keyframe ? Utils.SAMPLE_KEYFRAME : Utils.SAMPLE_VIDEO) : Utils.SAMPLE_AUDIO;
                BufferUtils.writeUInt64BE(buffer, sample.timestamp, samplesOffset); samplesOffset += 8;
                buffer.writeUInt32BE(sample.timescale, samplesOffset); samplesOffset += 4;
                buffer.writeUInt32BE(sample.size, samplesOffset); samplesOffset += 4;
                BufferUtils.writeUInt64BE(buffer, sample.offset, samplesOffset); samplesOffset += 8;
                if (sample instanceof VideoSample) {
                    buffer.writeUInt32BE(sample.compositionOffset, samplesOffset); samplesOffset += 4;
                }
            }
        }

        // Write file
        fs.ftruncateSync(fd, buffer.length);
        fs.writeSync(fd, buffer, 0, buffer.length, 0);
    }

    static read(fd) {
        return new IndexedFragmentList(fd);
    }

}

module.exports = FragmentListIndexer;
