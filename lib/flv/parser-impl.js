'use strict';

const AmfParser = require('./amf-parser');
const Utils = require('./utils');
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
    }

    parse() {
        // Parse header
        this._parseHeader();

        // Create movie
        this._createMovie();

        // Parse body
        this._parseBody();

        // Complete movie object
        [this.videoTrack, this.audioTrack].forEach((track) => {
            if (track.extraData && track.samples.length > 0) {
                track.sortSamples();
                track.ensureDuration();
                this.movie.addTrack(track);
            }
        });
        this.movie.ensureDuration();

        // Return movie object
        return this.movie;
    }

    _parseHeader() {
        let buffer = Buffer.allocUnsafe(Utils.HEADER_SIZE);
        this.reader.read(buffer, 0);
        if (buffer.toString('ascii', 0, 3) !== Utils.HEADER_PREFIX || buffer[3] !== Utils.HEADER_VERSION) {
            throw new Error('FLV header not found');
        }
        this.pos = buffer[8];
    }

    _createMovie() {
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

    _parseBody() {
        let buffer = Buffer.allocUnsafe(15);
        let size = this.reader.size();
        while (this.pos < size) {
            this.pos += this.reader.read(buffer, this.pos);
            let type = buffer[4];
            if (undefined === type) {
                break;
            }

            let dataSize = buffer.readUIntBE(5, 3);
            let timestamp = (buffer[11] << 24) + buffer.readUIntBE(8, 3);

            if (Utils.TYPE_SCRIPT === type) {
                this._parseScript(dataSize);
            } else if (Utils.TYPE_AUDIO === type) {
                this._parseAudio(dataSize, timestamp);
            } else if (Utils.TYPE_VIDEO === type) {
                this._parseVideo(dataSize, timestamp);
            }

            this.pos += dataSize;
        }
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
            this.audioTrack.sampleRate = (5512.5 * (1 << soundRate)) << 0;
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
        let compTime = buffer.readUIntBE(2, 3);

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
            sample.timestamp = timestamp;
            sample.timescale = this.videoTrack.timescale;
            sample.size = dataSize - headerSize;
            sample.offset = this.pos + headerSize;
            sample.compositionOffset = compTime;
            sample.keyframe = 1 === frameType;
            if (0 < sample.size) {
                this.videoTrack.samples.push(sample);
            }
        }
    }

}

module.exports = ParserImpl;
