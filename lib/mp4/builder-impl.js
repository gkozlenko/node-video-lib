'use strict';

const fs = require('fs');

const Utils = require('./utils');
const BufferUtils = require('../buffer-utils');
const SourceReader = require('../readers/source-reader');
const VideoTrack = require('../video-track');
const AudioTrack = require('../audio-track');
const VideoSample = require('../video-sample');

const CodecParser = require('../codecs/parser');
const CodecH264 = require('../codecs/codec-h264');
const CodecH265 = require('../codecs/codec-h265');
const CodecAac = require('../codecs/codec-aac');

const MAX_OFFSET_32 = 0xefffffff;
const MAX_AUDIO_SAMPLES_PACK = 10;

class BuilderImpl {

    constructor(movie, source, fd) {
        this.movie = movie;
        this.reader = SourceReader.create(source);
        this.fd = fd;
    }

    build() {
        // Tracks and Samples
        let tracks = [this.movie.videoTrack(), this.movie.audioTrack()]
            .filter(track => track !== null && track.samples.length > 0);
        let samples = tracks.reduce((array, track) => array.concat(track.samples), [])
            .sort((a, b) => a.offset - b.offset);

        // Chunks
        let videoChunks = [];
        let audioChunks = [];

        // Build chunks
        let offset = 0;
        let audioOffset = 0;
        let audioSamples = [];
        for (let i = 0, l = samples.length; i < l; i++) {
            let sample = samples[i];
            if (sample instanceof VideoSample) {
                if (audioSamples.length > 0) {
                    audioChunks.push({
                        offset: audioOffset,
                        samples: audioSamples,
                    });
                    audioSamples = [];
                }
                videoChunks.push({
                    offset: offset,
                    samples: [sample],
                });
            } else {
                if (audioSamples.length === MAX_AUDIO_SAMPLES_PACK) {
                    audioChunks.push({
                        offset: audioOffset,
                        samples: audioSamples,
                    });
                    audioSamples = [];
                }
                if (audioSamples.length === 0) {
                    audioOffset = offset;
                }
                audioSamples.push(sample);
            }
            offset += sample.size;
        }
        if (audioSamples.length > 0) {
            audioChunks.push({
                offset: audioOffset,
                samples: audioSamples,
            });
        }

        // Calculate MDAT size
        let mdatSize = samples.reduce((size, sample) => size + sample.size, 0);

        // Header
        let ftypAtom = Utils.createAtom(Utils.ATOM_FTYP);
        ftypAtom.majorBrand = 'isom';
        ftypAtom.minorVersion = 0;
        ftypAtom.compatibleBrands = ['isom', 'iso2', 'mp41'];
        let codecBrand = null;

        // Generate movie structure
        let moovAtom = Utils.createAtom(Utils.ATOM_MOOV);

        // Movie header
        let mvhdAtom = moovAtom.createAtom(Utils.ATOM_MVHD);
        mvhdAtom.duration = this.movie.duration;
        mvhdAtom.timescale = this.movie.timescale;
        mvhdAtom.nextTrackId = 1;

        // Offset atoms
        let offsetAtoms = {};

        // Tracks
        let trackId = 0;
        for (let track of tracks) {
            let codec;
            try {
                codec = CodecParser.parse(track.extraData);
            } catch (e) {
                // Skip track with unknown codec
                continue;
            }

            // Track header
            let trakAtom = moovAtom.createAtom(Utils.ATOM_TRAK);
            let tkhdAtom = trakAtom.createAtom(Utils.ATOM_TKHD);
            let mdiaAtom = trakAtom.createAtom(Utils.ATOM_MDIA);
            let mdhdAtom = mdiaAtom.createAtom(Utils.ATOM_MDHD);
            mdhdAtom.duration = track.duration;
            mdhdAtom.timescale = track.timescale;

            tkhdAtom.trackId = trackId;
            mvhdAtom.nextTrackId = ++trackId;

            let hdlrAtom = mdiaAtom.createAtom(Utils.ATOM_HDLR);
            let minfAtom = mdiaAtom.createAtom(Utils.ATOM_MINF);
            if (track instanceof VideoTrack) {
                tkhdAtom.width = track.width;
                tkhdAtom.height = track.height;
                hdlrAtom.handlerType = Utils.TRACK_TYPE_VIDEO;
                hdlrAtom.componentName = Utils.COMPONENT_NAME_VIDEO;
                minfAtom.createAtom(Utils.ATOM_VMHD);
            } else {
                hdlrAtom.handlerType = Utils.TRACK_TYPE_AUDIO;
                hdlrAtom.componentName = Utils.COMPONENT_NAME_AUDIO;
                minfAtom.createAtom(Utils.ATOM_SMHD);
            }

            // Samples table
            let stblAtom = minfAtom.createAtom(Utils.ATOM_STBL);

            // Samples
            let samples = track.samples.slice().sort((a, b) => a.offset - b.offset);

            // Sample sizes
            let stszAtom = stblAtom.createAtom(Utils.ATOM_STSZ);
            stszAtom.entries = samples.map((sample) => sample.size);

            // Sample durations
            let sttsAtom = stblAtom.createAtom(Utils.ATOM_STTS);
            sttsAtom.entries = samples.reduce(BuilderImpl.buildDurationsReducer, []).reduce(BuilderImpl.compressReducer, []);

            if (track instanceof VideoTrack) {
                // Sample keyframes
                let stssAtom = stblAtom.createAtom(Utils.ATOM_STSS);
                stssAtom.entries = samples.map((sample, i) => sample.keyframe ? i + 1 : null).filter(v => v !== null);

                // Sample composition offsets
                let cttsAtom = stblAtom.createAtom(Utils.ATOM_CTTS);
                cttsAtom.entries = samples.map((sample) => sample.compositionOffset).reduce(BuilderImpl.compressReducer, []);
            }

            // Chunks
            let chunks;
            if (track instanceof VideoTrack) {
                chunks = videoChunks;
            } else {
                chunks = audioChunks;
            }

            // Chunk offsets
            let offsAtom = null;
            if (mdatSize >= MAX_OFFSET_32) {
                offsAtom = stblAtom.createAtom(Utils.ATOM_CO64);
            } else {
                offsAtom = stblAtom.createAtom(Utils.ATOM_STCO);
            }
            offsAtom.entries = chunks.map((chunk) => chunk.offset);
            offsetAtoms[tkhdAtom.trackId] = offsAtom;

            // Sample to chunks
            let stscAtom = stblAtom.createAtom(Utils.ATOM_STSC);
            stscAtom.entries = chunks.reduce(BuilderImpl.buildSampleToChunksReducer, []);

            // Sample description
            let stsdAtom = stblAtom.createAtom(Utils.ATOM_STSD);
            let codecAtom = null;
            if (codec instanceof CodecH264) {
                codecAtom = stsdAtom.createAtom(Utils.ATOM_AVC1);
                codecBrand = 'avc1';
            } else if (codec instanceof CodecH265) {
                codecAtom = stsdAtom.createAtom(Utils.ATOM_HEV1);
                codecBrand = 'hvc1';
            } else if (codec instanceof CodecAac) {
                codecAtom = stsdAtom.createAtom(Utils.ATOM_MP4A);
                codecAtom.streamId = tkhdAtom.trackId;
            }

            if (codecAtom !== null) {
                codecAtom.extraData = track.extraData;
                if (track instanceof VideoTrack) {
                    codecAtom.width = track.width;
                    codecAtom.height = track.height;
                } else if (track instanceof AudioTrack) {
                    codecAtom.channels = track.channels;
                    codecAtom.sampleRate = track.sampleRate;
                    codecAtom.sampleSize = track.sampleSize;
                }
            }
        }

        // Add compatible brands
        if (codecBrand !== null) {
            ftypAtom.compatibleBrands.push(codecBrand);
        }

        // Calculate header size
        let headerSize = ftypAtom.bufferSize() + moovAtom.bufferSize() + 8;
        if (mdatSize >= MAX_OFFSET_32) {
            headerSize += 8;
        }

        // Adjust sample offsets
        for (let trackId in offsetAtoms) {
            let offsAtom = offsetAtoms[trackId];
            offsAtom.entries = offsAtom.entries.map((offset) => offset + headerSize);
        }

        // Truncate file
        fs.ftruncateSync(this.fd);

        // Generate movie header
        let header = Buffer.alloc(headerSize); // don't use allocUnsafe!
        ftypAtom.build(header, 0);
        moovAtom.build(header, ftypAtom.bufferSize());
        if (mdatSize >= MAX_OFFSET_32) {
            header.writeUInt32BE(1, ftypAtom.bufferSize() + moovAtom.bufferSize());
            BufferUtils.writeUInt64BE(header, mdatSize, ftypAtom.bufferSize() + moovAtom.bufferSize() + 4);
        } else {
            header.writeUInt32BE(mdatSize + 8, ftypAtom.bufferSize() + moovAtom.bufferSize());
        }
        header.write(Utils.ATOM_MDAT, headerSize - 4);

        // Write header
        fs.writeSync(this.fd, header, 0, header.length, 0);

        // Write chunks
        let pos = headerSize;
        for (let i = 0, l = samples.length; i < l; i++) {
            let sample = samples[i];
            let buffer = Buffer.allocUnsafe(sample.size);
            this.reader.read(buffer, sample.offset);
            fs.writeSync(this.fd, buffer, 0, buffer.length, pos);
            pos += buffer.length;
        }

        return true;
    }

    static compressReducer(array, value) {
        if (array.length === 0 || array[array.length - 1] !== value) {
            array.push(1, value);
        } else {
            array[array.length - 2]++;
        }
        return array;
    }

    static buildDurationsReducer(result, sample, index, samples) {
        if (index === 0) {
            if (samples.length > 1) {
                result.push(samples[1].timestamp - sample.timestamp);
            } else {
                result.push(0);
            }
        } else {
            result.push(sample.timestamp - (index > 0 ? samples[index - 1].timestamp : 0));
        }
        return result;
    }

    static buildSampleToChunksReducer(result, chunk, index, chunks) {
        if (result.length === 0) {
            result.push(1, chunk.samples.length, 1, 2);
        } else if (result[result.length - 3] !== chunk.samples.length) {
            result.push(chunk.samples.length, 1, result[result.length - 1] + 1);
        } else {
            result[result.length - 1]++;
        }
        if (index === chunks.length - 1) {
            result = result.slice(0, result.length - 1);
        }
        return result;
    }

}

module.exports = BuilderImpl;
