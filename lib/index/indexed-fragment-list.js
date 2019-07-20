'use strict';

const fs = require('fs');

const Utils = require('./utils');
const BufferUtils = require('../buffer-utils');
const AudioSample = require('../audio-sample');
const VideoSample = require('../video-sample');
const Fragment = require('../fragment');
const FragmentList = require('../fragment-list');

class IndexedFragmentList extends FragmentList {

    constructor(fd) {
        super();

        this.fd = fd;

        // Read prefix
        let bufPrefix = Buffer.allocUnsafe(8);
        fs.readSync(fd, bufPrefix, 0, bufPrefix.length, 0);
        if (bufPrefix.toString('ascii', 0, 3) !== Utils.INDEX_PREFIX || bufPrefix[3] !== Utils.INDEX_VERSION) {
            throw new Error('Invalid index file');
        }
        this._fragmentsOffset = bufPrefix.readUInt32BE(4);

        // Read header
        let bufHeader = Buffer.allocUnsafe(this._fragmentsOffset - 8);
        fs.readSync(fd, bufHeader, 0, bufHeader.length, 8);
        let pos = 0;
        this._fragmentsCount = bufHeader.readUInt32BE(pos); pos += 4;
        this.fragmentDuration = bufHeader.readUInt32BE(pos); pos += 4;
        this.duration = BufferUtils.readUInt64BE(bufHeader, pos); pos += 8;
        this.timescale = bufHeader.readUInt32BE(pos); pos += 4;
        let videoExtraDataLength = bufHeader.readUInt16BE(pos); pos += 2;
        if (videoExtraDataLength > 0) {
            this.video = {
                extraData: null,
                codec: null,
                timescale: 0,
                duration: 0,
                size: 0,
                width: 0,
                height: 0,
            };
            this.video.extraData = bufHeader.slice(pos, pos + videoExtraDataLength); pos += videoExtraDataLength;
            let codecSize = bufHeader.readUInt16BE(pos); pos += 2;
            if (codecSize > 0) {
                this.video.codec = bufHeader.toString('ascii', pos, pos + codecSize); pos += codecSize;
            }
            this.video.timescale = bufHeader.readUInt32BE(pos); pos += 4;
            this.video.duration = bufHeader.readUInt32BE(pos); pos += 4;
            this.video.size = BufferUtils.readUInt64BE(bufHeader, pos); pos += 8;
            this.video.width = bufHeader.readUInt32BE(pos); pos += 4;
            this.video.height = bufHeader.readUInt32BE(pos); pos += 4;
        }
        let audioExtraDataLength = bufHeader.readUInt16BE(pos); pos += 2;
        if (audioExtraDataLength > 0) {
            this.audio = {
                extraData: null,
                codec: null,
                timescale: 0,
                duration: 0,
                size: 0,
            };
            this.audio.extraData = bufHeader.slice(pos, pos + audioExtraDataLength); pos += audioExtraDataLength;
            let codecSize = bufHeader.readUInt16BE(pos); pos += 2;
            if (codecSize > 0) {
                this.audio.codec = bufHeader.toString('ascii', pos, pos + codecSize); pos += codecSize;
            }
            this.audio.timescale = bufHeader.readUInt32BE(pos); pos += 4;
            this.audio.duration = bufHeader.readUInt32BE(pos); pos += 4;
            this.audio.size = BufferUtils.readUInt64BE(bufHeader, pos); pos += 8;
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
        let bufFragment = Buffer.allocUnsafe(Utils.FRAGMENT_SIZE);
        fs.readSync(this.fd, bufFragment, 0, bufFragment.length, this._fragmentsOffset + index * Utils.FRAGMENT_SIZE);

        let pos = 0;
        let samplesCount = bufFragment.readUInt32BE(pos); pos += 4;
        let samplesOffset = bufFragment.readUInt32BE(pos); pos += 4;

        let result = new Fragment();
        result.timestamp = BufferUtils.readUInt64BE(bufFragment, pos); pos += 8;
        result.duration = BufferUtils.readUInt64BE(bufFragment, pos); pos += 8;

        // Read samples
        let bufSamples = Buffer.allocUnsafe(samplesCount * Utils.SAMPLE_SIZE);
        fs.readSync(this.fd, bufSamples, 0, bufSamples.length, samplesOffset);
        let samples = new Array(samplesCount);
        pos = 0;
        for (let i = 0; i < samplesCount; i++) {
            let type = bufSamples[pos++];
            let sample = Object.create(type === Utils.SAMPLE_AUDIO ? AudioSample.prototype : VideoSample.prototype);
            sample.timestamp = BufferUtils.readUInt64BE(bufSamples, pos); pos += 8;
            sample.timescale = bufSamples.readUInt32BE(pos); pos += 4;
            sample.size = bufSamples.readUInt32BE(pos); pos += 4;
            sample.offset = BufferUtils.readUInt64BE(bufSamples, pos); pos += 8;
            if (sample instanceof VideoSample) {
                sample.keyframe = type === Utils.SAMPLE_KEYFRAME;
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

module.exports = IndexedFragmentList;
