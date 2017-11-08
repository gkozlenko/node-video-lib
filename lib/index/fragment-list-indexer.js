'use strict';

const fs = require('fs');

const BufferUtils = require('../buffer-utils');
const VideoSample = require('../video-sample');
const AudioSample = require('../audio-sample');
const Fragment = require('../fragment');
const FragmentList = require('../fragment-list');

const INDEX_PREFIX = 'idx';
const INDEX_VERSION = 2;
const HEADER_SIZE = 32;
const HEADER_VIDEO_SIZE = 26;
const HEADER_AUDIO_SIZE = 18;
const FRAGMENT_SIZE = 24;
const SAMPLE_SIZE = 29;

const SAMPLE_AUDIO = 0;
const SAMPLE_VIDEO = 1;
const SAMPLE_KEYFRAME = 2;

class IndexedFragmentList extends FragmentList {

    constructor(fd) {
        super();

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
        this.duration = BufferUtils.readInt64BE(bufHeader, pos); pos += 8;
        this.timescale = bufHeader.readUInt32BE(pos); pos += 4;
        let videoExtraDataLength = bufHeader.readUInt16BE(pos); pos += 2;
        if (videoExtraDataLength > 0) {
            this.video = {
                extraData: new Buffer(videoExtraDataLength),
                codec: null,
                timescale: 0,
                duration: 0,
                size: 0,
                width: 0,
                height: 0,
            };
            bufHeader.copy(this.video.extraData, 0, pos, pos + videoExtraDataLength); pos += videoExtraDataLength;
            let codecSize = bufHeader.readUInt16BE(pos); pos += 2;
            if (codecSize > 0) {
                this.video.codec = bufHeader.toString('ascii', pos, pos + codecSize); pos += codecSize;
            }
            this.video.timescale = bufHeader.readUInt32BE(pos); pos += 4;
            this.video.duration = bufHeader.readUInt32BE(pos); pos += 4;
            this.video.size = BufferUtils.readInt64BE(bufHeader, pos); pos += 8;
            this.video.width = bufHeader.readUInt32BE(pos); pos += 4;
            this.video.height = bufHeader.readUInt32BE(pos); pos += 4;
        }
        this.audioExtraData = null;
        let audioExtraDataLength = bufHeader.readUInt16BE(pos); pos += 2;
        if (audioExtraDataLength > 0) {
            this.audio = {
                extraData: new Buffer(audioExtraDataLength),
                codec: null,
                timescale: 0,
                duration: 0,
                size: 0,
            };
            bufHeader.copy(this.audio.extraData, 0, pos, pos + audioExtraDataLength); pos += audioExtraDataLength;
            let codecSize = bufHeader.readUInt16BE(pos); pos += 2;
            if (codecSize > 0) {
                this.audio.codec = bufHeader.toString('ascii', pos, pos + codecSize); pos += codecSize;
            }
            this.audio.timescale = bufHeader.readUInt32BE(pos); pos += 4;
            this.audio.duration = bufHeader.readUInt32BE(pos); pos += 4;
            this.audio.size = BufferUtils.readInt64BE(bufHeader, pos); pos += 8;
        }
    }

    createFragment() {
        throw new Error('Not supported');
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
        result.timestamp = BufferUtils.readInt64BE(bufFragment, pos); pos += 8;
        result.duration = BufferUtils.readInt64BE(bufFragment, pos); pos += 8;

        // Read samples
        let bufSamples = new Buffer(samplesCount * SAMPLE_SIZE);
        fs.readSync(this.fd, bufSamples, 0, bufSamples.length, samplesOffset);
        let samples = new Array(samplesCount);
        pos = 0;
        for (let i = 0; i < samplesCount; i++) {
            let type = bufSamples[pos++];
            let sample = Object.create(type === SAMPLE_AUDIO ? AudioSample.prototype : VideoSample.prototype);
            sample.timestamp = BufferUtils.readInt64BE(bufSamples, pos); pos += 8;
            sample.timescale = bufSamples.readUInt32BE(pos); pos += 4;
            sample.size = bufSamples.readUInt32BE(pos); pos += 4;
            sample.offset = BufferUtils.readInt64BE(bufSamples, pos); pos += 8;
            if (sample instanceof VideoSample) {
                sample.keyframe = type === SAMPLE_KEYFRAME;
                sample.compositionOffset = bufSamples.readUInt32BE(pos); pos += 4;
            }
            samples[i] = sample;
        }

        result.samples = samples;
        result.timescale = this.timescale;
        if (this.video) {
            result.videoExtraData = this.video.extraData;
        }
        if (this.audio) {
            result.audioExtraData = this.audio.extraData;
        }
        return result;
    }

}

class FragmentListIndexer {

    static index(fragmentList, fd) {
        // Calc buffer size and offsets
        let bufferSize = HEADER_SIZE;
        if (fragmentList.video) {
            bufferSize += fragmentList.video.extraData.length + HEADER_VIDEO_SIZE;
            if (fragmentList.video.codec) {
                bufferSize += fragmentList.video.codec.length;
            }
        }
        if (fragmentList.audio) {
            bufferSize += fragmentList.audio.extraData.length + HEADER_AUDIO_SIZE;
            if (fragmentList.audio.codec) {
                bufferSize += fragmentList.audio.codec.length;
            }
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
        BufferUtils.writeInt64BE(buffer, fragmentList.duration, pos); pos += 8;
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
            BufferUtils.writeInt64BE(buffer, fragmentList.video.size, pos); pos += 8;
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
            BufferUtils.writeInt64BE(buffer, fragmentList.audio.size, pos); pos += 8;
        } else {
            buffer.writeUInt16BE(0, pos); pos += 2;
        }

        // Write fragments
        for (let i = 0, fLen = fragmentList.fragments.length; i < fLen; i++) {
            let fragment = fragmentList.fragments[i];
            buffer.writeUInt32BE(fragment.samples.length, pos); pos += 4;
            buffer.writeUInt32BE(samplesOffset, pos); pos += 4;
            BufferUtils.writeInt64BE(buffer, fragment.timestamp, pos); pos += 8;
            BufferUtils.writeInt64BE(buffer, fragment.duration, pos); pos += 8;
            // Write samples
            for (let j = 0, sLen = fragment.samples.length; j < sLen; j++) {
                let sample = fragment.samples[j];
                buffer[samplesOffset++] = sample instanceof VideoSample ? (sample.keyframe ? SAMPLE_KEYFRAME : SAMPLE_VIDEO) : SAMPLE_AUDIO;
                BufferUtils.writeInt64BE(buffer, sample.timestamp, samplesOffset); samplesOffset += 8;
                buffer.writeUInt32BE(sample.timescale, samplesOffset); samplesOffset += 4;
                buffer.writeUInt32BE(sample.size, samplesOffset); samplesOffset += 4;
                BufferUtils.writeInt64BE(buffer, sample.offset, samplesOffset); samplesOffset += 8;
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
