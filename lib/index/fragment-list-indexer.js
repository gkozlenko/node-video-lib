'use strict';

const fs = require('fs');

const BufferUtils = require('../buffer-utils');
const FragmentList = require('../fragment-list');
const VideoSample = require('../video-sample');

const INDEX_PREFIX = 'idx';
const INDEX_VERSION = 1;
const HEADER_SIZE = 44;
const FRAGMENT_SIZE = 24;
const SAMPLE_SIZE = 29;

const SAMPLE_AUDIO = 0;
const SAMPLE_VIDEO = 1;
const SAMPLE_KEYFRAME = 2;

class FragmentListIndexer {

    static index(fragmentList) {
        if (!(fragmentList instanceof FragmentList)) {
            throw new Error('Argument 1 should be instance of FragmentList');
        }

        // Calc buffer size and offsets
        let bufferSize = HEADER_SIZE;
        if (fragmentList.videoExtraData) {
            bufferSize += fragmentList.videoExtraData.length;
        }
        if (fragmentList.audioExtraData) {
            bufferSize += fragmentList.audioExtraData.length;
        }
        let fragmentsOffset = bufferSize;
        bufferSize += FRAGMENT_SIZE * fragmentList.fragments.length;
        let samplesOffset = bufferSize;
        for (let i = 0, len = fragmentList.fragments.length; i < len; i++) {
            bufferSize += SAMPLE_SIZE * fragmentList.fragments[i].samples.length;
        }
        let buffer = new Buffer(bufferSize);

        // Write header
        let pos = 0;
        buffer.write(INDEX_PREFIX, pos); pos += 3;
        buffer[pos++] = INDEX_VERSION;
        buffer.writeUInt32BE(fragmentList.fragments.length, pos); pos += 4;
        buffer.writeUInt32BE(fragmentsOffset, pos); pos += 4;
        buffer.writeUInt32BE(fragmentList.fragmentDuration, pos); pos += 4;
        BufferUtils.writeUInt64BE(buffer, fragmentList.duration, pos); pos += 8;
        buffer.writeUInt32BE(fragmentList.timescale, pos); pos += 4;
        buffer.writeUInt32BE(fragmentList.width, pos); pos += 4;
        buffer.writeUInt32BE(fragmentList.height, pos); pos += 4;
        if (fragmentList.videoExtraData) {
            buffer.writeUInt32BE(fragmentList.videoExtraData.length, pos); pos += 4;
            fragmentList.videoExtraData.copy(buffer, pos); pos += fragmentList.videoExtraData.length;
        } else {
            buffer.writeUInt32BE(0, pos); pos += 4;
        }
        if (fragmentList.audioExtraData) {
            buffer.writeUInt32BE(fragmentList.audioExtraData.length, pos); pos += 4;
            fragmentList.audioExtraData.copy(buffer, pos); pos += fragmentList.audioExtraData.length;
        } else {
            buffer.writeUInt32BE(0, pos); pos += 4;
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
                buffer[samplesOffset++] = sample instanceof VideoSample ? (sample.keyframe ? SAMPLE_KEYFRAME : SAMPLE_VIDEO) : SAMPLE_AUDIO;
                BufferUtils.writeUInt64BE(buffer, sample.timestamp, samplesOffset); samplesOffset += 8;
                buffer.writeUInt32BE(sample.timescale, samplesOffset); samplesOffset += 4;
                buffer.writeUInt32BE(sample.size, samplesOffset); samplesOffset += 4;
                BufferUtils.writeUInt64BE(buffer, sample.offset, samplesOffset); samplesOffset += 8;
                if (sample instanceof VideoSample) {
                    buffer.writeUInt32BE(sample.compositionOffset, samplesOffset); samplesOffset += 4;
                }
            }
        }

        return buffer;
    }

}

module.exports = FragmentListIndexer;
