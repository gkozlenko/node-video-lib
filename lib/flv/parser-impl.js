'use strict';

const AmfParser = require('./amf-parser');
const Utils = require('./utils');
const BufferUtils = require('../buffer-utils');

const Movie = require('../movie');
const AudioTrack = require('../audio-track');
const VideoTrack = require('../video-track');
const AudioSample = require('../audio-sample');
const VideoSample = require('../video-sample');
const SourceReader = require('../readers/source-reader');
const CodecParser = require('../codecs/parser');

class ParserImpl {

    constructor(source) {
        this.source = source;
        this.reader = SourceReader.create(this.source);
        this.size = this.reader.size();
        this.pos = 0;

        // Create movie
        this.movie = new Movie();
        this.movie.timescale = Utils.MOVIE_TIMESCALE;

        // Create video track
        this.videoTrack = new VideoTrack();
        this.videoTrack.timescale = Utils.MOVIE_TIMESCALE;

        // Create audio track
        this.audioTrack = new AudioTrack();
        this.audioTrack.timescale = Utils.MOVIE_TIMESCALE;
    }

    parse() {
        this._parseHeader();

        // Parse tags
        let bufType = Buffer.allocUnsafe(15);
        while (this.pos < this.size) {
            this.pos += this.reader.read(bufType, this.pos);
            let type = bufType[4];
            if (undefined === type) {
                break;
            }

            let dataSize = BufferUtils.readInt24BE(bufType, 5);
            let timestamp = BufferUtils.readInt24BE(bufType, 8);

            if (Utils.TYPE_SCRIPT === type) {
                this._parseScript(dataSize);
            } else if (Utils.TYPE_AUDIO === type) {
                this._parseAudio(dataSize, timestamp);
            } else if (Utils.TYPE_VIDEO === type) {
                this._parseVideo(dataSize, timestamp);
            }

            this.pos += dataSize;
        }

        // Complete movie object
        [this.videoTrack, this.audioTrack].map((track) => {
            if (track.extraData && track.samples.length > 0) {
                track.ensureDuration();
                this.movie.addTrack(track);
            }
        });
        this.movie.ensureDuration();

        // Return movie object
        return this.movie;
    }

    _parseHeader() {
        let bufHeader = Buffer.allocUnsafe(Utils.HEADER_SIZE);
        this.reader.read(bufHeader, 0);
        if (bufHeader.toString('ascii', 0, 3) !== Utils.HEADER_PREFIX || bufHeader[3] !== Utils.HEADER_VERSION) {
            throw new Error('FLV header not found');
        }
        this.pos = bufHeader[8];
    }

    _parseScript(dataSize) {
        let buffer = Buffer.allocUnsafe(dataSize);
        this.reader.read(buffer, this.pos);

        let data = AmfParser.parse(buffer);
        if (data && data.length > 1) {
            let metaData = data[1];
            if (metaData['duration'] !== undefined) {
                let duration = metaData['duration'] * Utils.MOVIE_TIMESCALE;
                this.movie.duration = duration;
                this.videoTrack.duration = duration;
                this.audioTrack.duration = duration;
            }
            if (metaData['width'] !== undefined) {
                this.videoTrack.width = metaData['width'];
            }
            if (metaData['height'] !== undefined) {
                this.videoTrack.height = metaData['height'];
            }
        }
    }

    _parseAudio(dataSize, timestamp) {
        // Read header
        let headerSize = 2;
        let buffer = Buffer.allocUnsafe(headerSize);
        this.reader.read(buffer, this.pos);

        // Metadata
        let flags = buffer[0];
        let soundType = flags & 0x01;
        let soundSize = (flags & 0x02) >> 1;
        let soundRate = (flags & 0x0c) >> 2;
        let soundFormat = (flags & 0xf0) >> 4;

        if (Utils.AUDIO_FORMAT_AAC !== soundFormat) {
            return;
        }

        if (0 === buffer[1]) {
            // Update audio track
            this.audioTrack.channels = 1 === soundType ? 2 : 1;
            this.audioTrack.sampleRate = parseInt(5512.5 * (1 << soundRate), 10);
            this.audioTrack.sampleSize = 1 === soundSize ? 16 : 8;

            // Get codec info
            let extraData = Buffer.allocUnsafe(4 + dataSize - headerSize);
            extraData.write('mp4a');
            this.reader.read(extraData, this.pos + headerSize, 4);
            this.audioTrack.extraData = extraData;
            this.audioTrack.codec = CodecParser.parse(extraData).codec();
        } else {
            // Get sample info
            let sample = Object.create(AudioSample.prototype);
            sample.timestamp = timestamp;
            sample.timescale = this.audioTrack.timescale;
            sample.size = dataSize - headerSize;
            sample.offset = this.pos + headerSize;
            if (0 < sample.size) {
                this.audioTrack.samples.push(sample);
            }
        }
    }

    _parseVideo(dataSize, timestamp) {
        // Read header
        let headerSize = 5;
        let buffer = Buffer.allocUnsafe(headerSize);
        this.reader.read(buffer, this.pos);

        // Metadata
        let flags = buffer[0];
        let videoFormat = flags & 0x0f;
        let frameType = (flags & 0xf0) >> 4;
        let compTime = BufferUtils.readInt24BE(buffer, 2);

        if (Utils.VIDEO_FORMAT_H264 !== videoFormat) {
            return;
        }

        if (0 === buffer[1]) {
            // Get codec info
            let extraData = Buffer.allocUnsafe(4 + dataSize - headerSize);
            extraData.write('avcC');
            this.reader.read(extraData, this.pos + headerSize, 4);
            this.videoTrack.extraData = extraData;
            this.videoTrack.codec = CodecParser.parse(extraData).codec();
        } else {
            // Get sample info
            let sample = Object.create(VideoSample.prototype);
            sample.compositionOffset = compTime;
            sample.keyframe = 1 === frameType;
            sample.timestamp = timestamp;
            sample.timescale = this.videoTrack.timescale;
            sample.size = dataSize - headerSize;
            sample.offset = this.pos + headerSize;
            if (0 < sample.size) {
                this.videoTrack.samples.push(sample);
            }
        }
    }

}

module.exports = ParserImpl;
