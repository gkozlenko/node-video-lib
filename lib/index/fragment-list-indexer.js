'use strict';

const fs = require('fs');

const BufferUtils = require('../buffer-utils');
const VideoSample = require('../video-sample');
const AudioSample = require('../audio-sample');
const Fragment = require('../fragment');

const INDEX_PREFIX = 'idx';
const INDEX_VERSION = 1;
const HEADER_SIZE = 44;
const FRAGMENT_SIZE = 24;
const SAMPLE_SIZE = 29;

const SAMPLE_AUDIO = 0;
const SAMPLE_VIDEO = 1;
const SAMPLE_KEYFRAME = 2;

class FragmentList {

    constructor(fd) {
        this.fd = fd;

        // Read prefix
        let bufPrefix = new Buffer(8);
        fs.readSync(fd, bufPrefix, 0, bufPrefix.length, 0);
        if (bufPrefix.toString('ascii', 0, 3) !== INDEX_PREFIX || bufPrefix[3] !== INDEX_VERSION) {
            throw new Error('Invalid index file');
        }
        this._fragmentsOffset = bufPrefix.readUInt32BE(4);

        // Read header
        let bufHeader = new Buffer(this._fragmentsOffset - 8);
        fs.readSync(fd, bufHeader, 0, bufHeader.length, 8);
        let pos = 0;
        this._fragmentsCount = bufHeader.readUInt32BE(pos); pos += 4;
        this.fragmentDuration = bufHeader.readUInt32BE(pos); pos += 4;
        this.duration = BufferUtils.readUInt64BE(bufHeader, pos); pos += 8;
        this.timescale = bufHeader.readUInt32BE(pos); pos += 4;
        this.width = bufHeader.readUInt32BE(pos); pos += 4;
        this.height = bufHeader.readUInt32BE(pos); pos += 4;
        this.videoExtraData = null;
        let videoExtraDataLength = bufHeader.readUInt32BE(pos); pos += 4;
        if (videoExtraDataLength > 0) {
            this.videoExtraData = new Buffer(videoExtraDataLength);
            bufHeader.copy(this.videoExtraData, 0, pos, pos + videoExtraDataLength); pos += videoExtraDataLength;
        }
        this.audioExtraData = null;
        let audioExtraDataLength = bufHeader.readUInt32BE(pos); pos += 4;
        if (audioExtraDataLength > 0) {
            this.audioExtraData = new Buffer(audioExtraDataLength);
            bufHeader.copy(this.audioExtraData, 0, pos, pos + audioExtraDataLength); pos += audioExtraDataLength;
        }
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

    resolution() {
        if (this.width && this.height) {
            return `${this.width}x${this.height}`
        }
        return '';
    }

    count() {
        return this._fragmentsCount;
    }

    get(index) {
        if (index >= this._fragmentsCount) {
            return;
        }
        let bufFragment = new Buffer(FRAGMENT_SIZE);
        fs.readSync(this.fd, bufFragment, 0, bufFragment.length, this._fragmentsOffset + index * FRAGMENT_SIZE);

        let pos = 0;
        let samplesCount = bufFragment.readUInt32BE(pos); pos += 4;
        let samplesOffset = bufFragment.readUInt32BE(pos); pos += 4;

        let result = new Fragment();
        result.timestamp = BufferUtils.readUInt64BE(bufFragment, pos); pos += 8;
        result.duration = BufferUtils.readUInt64BE(bufFragment, pos); pos += 8;

        // Read samples
        let bufSamples = new Buffer(samplesCount * SAMPLE_SIZE);
        fs.readSync(this.fd, bufSamples, 0, bufSamples.length, samplesOffset);
        let samples = new Array(samplesCount);
        pos = 0;
        for (let i = 0; i < samplesCount; i++) {
            let type = bufSamples[pos++];
            let sample = Object.create(type === SAMPLE_AUDIO ? AudioSample.prototype : VideoSample.prototype);
            sample.timestamp = BufferUtils.readUInt64BE(bufSamples, pos); pos += 8;
            sample.timescale = bufSamples.readUInt32BE(pos); pos += 4;
            sample.size = bufSamples.readUInt32BE(pos); pos += 4;
            sample.offset = BufferUtils.readUInt64BE(bufSamples, pos); pos += 8;
            if (sample instanceof VideoSample) {
                sample.keyframe = type === SAMPLE_KEYFRAME;
                sample.compositionOffset = bufSamples.readUInt32BE(pos); pos += 4;
            }
            samples[i] = sample;
        }

        result.samples = samples;
        result.timescale = this.timescale;
        result.videoExtraData = this.videoExtraData;
        result.audioExtraData = this.audioExtraData;
        return result;
    }

}

class FragmentListIndexer {

    static index(fragmentList, fd) {
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
        buffer.writeUInt32BE(fragmentsOffset, pos); pos += 4;
        buffer.writeUInt32BE(fragmentList.fragments.length, pos); pos += 4;
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

        // Write file
        fs.ftruncateSync(fd, buffer.length);
        fs.writeSync(fd, buffer, 0, buffer.length, 0);
    }

    static read(fd) {
        return new FragmentList(fd);
    }

}

module.exports = FragmentListIndexer;
