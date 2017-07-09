'use strict';

const AmfUtils = require('node-amfutils');
const BufferUtils = require('../buffer-utils');

const Movie = require('../movie');
const AudioTrack = require('../audio-track');
const VideoTrack = require('../video-track');
const AudioSample = require('../audio-sample');
const VideoSample = require('../video-sample');
const SourceReader = require('../source-reader');

const MOVIE_TIMESCALE = 1000;
const HEADER_SIZE = 9;
const HEADER_PREFIX = 'FLV';
const HEADER_VERSION = 1;

const TYPE_SCRIPT = 18;
const TYPE_VIDEO = 9;
const TYPE_AUDIO = 8;

const AUDIO_FORMAT_AAC = 10;
const VIDEO_FORMAT_H264 = 7;

class Parser {

    /**
     * Parse FLV file
     * @param {(int|Buffer)} source
     * @returns {Movie}
     */
    static parse(source) {
        let reader = new SourceReader(source);
        let sourceSize = reader.size();

        // Create movie
        let movie = new Movie();
        movie.timescale = MOVIE_TIMESCALE;
        let videoTrack = new VideoTrack();
        videoTrack.timescale = MOVIE_TIMESCALE;
        let audioTrack = new AudioTrack();
        audioTrack.timescale = MOVIE_TIMESCALE;

        // Parse header
        let bufHeader = new Buffer(HEADER_SIZE);
        reader.read(bufHeader, 0);
        if (bufHeader.toString('ascii', 0, 3) !== HEADER_PREFIX || bufHeader[3] !== HEADER_VERSION) {
            throw new Error('FLV header not found');
        }
        let pos = bufHeader[8];

        // Parse tags
        let bufType = new Buffer(15);
        let setAudioData = false;
        while (pos < sourceSize) {
            pos += reader.read(bufType, pos);
            let type = bufType[4];
            if (undefined === type) {
                break;
            }
            let dataSize = BufferUtils.readInt24BE(bufType, 5);
            let timestamp = BufferUtils.readInt24BE(bufType, 8);

            if (TYPE_SCRIPT === type) {
                let bufTag = new Buffer(dataSize);
                pos += reader.read(bufTag, pos);
                let data = AmfUtils.amf0Decode(bufTag);
                if (data && data.length > 1) {
                    let metaData = data[1];
                    if (metaData['duration'] !== undefined) {
                        let duration = metaData['duration'] * MOVIE_TIMESCALE;
                        movie.duration = duration;
                        videoTrack.duration = duration;
                        audioTrack.duration = duration;
                    }
                    if (metaData['width'] !== undefined) {
                        videoTrack.width = metaData['width'];
                    }
                    if (metaData['height'] !== undefined) {
                        videoTrack.height = metaData['height'];
                    }
                }
            } else if (TYPE_AUDIO === type) {
                let bufTag = new Buffer(2);
                reader.read(bufTag, pos);

                let headerSize = 1;
                let flags = bufTag[0];
                let soundType = flags & 0x01;
                let soundSize = (flags & 0x02) >> 1;
                let soundRate = (flags & 0x0c) >> 2;
                let soundFormat = (flags & 0xf0) >> 4;

                if (!setAudioData) {
                    audioTrack.channels = 1 === soundType ? 2 : 1;
                    audioTrack.sampleRate = parseInt(5512.5 * (1 << soundRate));
                    audioTrack.sampleSize = 1 === soundSize ? 16 : 8;
                    setAudioData = true;
                }

                if (AUDIO_FORMAT_AAC === soundFormat) {
                    headerSize += 1;
                    let packetType = bufTag[1];
                    if (0 === packetType) {
                        let extraData = new Buffer(dataSize - headerSize);
                        reader.read(extraData, pos + headerSize);
                        audioTrack.extraData = extraData;
                        pos += dataSize;
                        continue;
                    }
                }

                let sample = Object.create(AudioSample.prototype);
                sample.timestamp = timestamp;
                sample.timescale = audioTrack.timescale;
                sample.size = dataSize - headerSize;
                sample.offset = pos + headerSize;
                if (0 < sample.size) {
                    audioTrack.samples.push(sample);
                    if (movie.duration === 0) {
                        audioTrack.duration = sample.timestamp;
                    }
                }
                pos += dataSize;
            } else if (TYPE_VIDEO === type) {
                let bufTag = new Buffer(5);
                reader.read(bufTag, pos);

                let headerSize = 1;
                let flags = bufTag[0];

                let videoFormat = flags & 0x0f;
                let frameType = (flags & 0xf0) >> 4;
                let compTime = 0;
                if (VIDEO_FORMAT_H264 === videoFormat) {
                    headerSize += 4;
                    let packetType = bufTag[1];
                    compTime = BufferUtils.readInt24BE(bufTag, 2);
                    if (0 === packetType) {
                        let extraData = new Buffer(dataSize - headerSize);
                        reader.read(extraData, pos + headerSize);
                        videoTrack.extraData = extraData;
                        pos += dataSize;
                        continue;
                    }
                }

                let sample = Object.create(VideoSample.prototype);
                sample.compositionOffset = compTime;
                sample.keyframe = 1 === frameType;
                sample.timestamp = timestamp;
                sample.timescale = videoTrack.timescale;
                sample.size = dataSize - headerSize;
                sample.offset = pos + headerSize;
                if (0 < sample.size) {
                    videoTrack.samples.push(sample);
                    if (movie.duration === 0) {
                        videoTrack.duration = sample.timestamp;
                    }
                }

                pos += dataSize;
            } else {
                pos += dataSize;
            }
        }

        // Add tracks
        [videoTrack, audioTrack].map((track) => {
            if (track.samples.length > 0) {
                movie.addTrack(track);
            }
        });

        // Set movie duration
        if (movie.duration === 0) {
            movie.duration = movie.tracks.reduce((duration, track) => {
                return Math.max(duration, track.duration);
            }, 0);
        }

        // Return movie object
        return movie;
    }

    /**
     * Check FLV file
     * @param {Buffer} buffer
     * @returns {boolean}
     * @private
     */
    static _check(buffer) {
        return buffer.toString('ascii', 0, 3) === HEADER_PREFIX && buffer[3] === HEADER_VERSION;
    }

}

module.exports = Parser;
