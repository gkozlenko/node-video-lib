'use strict';

const fs = require('fs');

const Utils = require('./utils');
const VideoTrack = require('../video-track');
const AudioTrack = require('../audio-track');

const CodecParser = require('../codecs/parser');
const CodecH264 = require('../codecs/codec-h264');
const CodecH265 = require('../codecs/codec-h265');
const CodecAac = require('../codecs/codec-aac');

const MAX_OFFSET_32 = 0xefffffff;
const MAX_CHUNK_SIZE = 1048576; // 1 MB
const SAMPLE_DESCRIPTION_ID = 1;

class Builder {

    /**
     * Build MP4 file
     * @param {Movie} movie
     * @param {int} fd
     * @returns {boolean}
     */
    static build(movie, fd) {
        let offsetBase = 0;

        // Generate atoms structure
        let moovAtom = Utils.createAtom(Utils.ATOM_MOOV);

        // Movie header
        let mvhdAtom = moovAtom.createAtom(Utils.ATOM_MVHD);
        mvhdAtom.duration = movie.duration;
        mvhdAtom.timescale = movie.timescale;
        mvhdAtom.nextTrackId = 1;

        // Tracks
        let trackId = 0;
        for (let track of [movie.videoTrack(), movie.audioTrack()].filter(track => track !== null && track.samples.length > 0)) {
            let codec;
            try {
                codec = CodecParser.parse(track.extraData);
            } catch (e) {
                // Skip track with unknown codec
                continue;
            }

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
            let stblAtom = minfAtom.createAtom(Utils.ATOM_STBL);

            // Samples
            let samples = track.samples.slice();
            samples.sort((sample1, sample2) => sample1.offset - sample2.offset);

            // Sample sizes
            let stszAtom = stblAtom.createAtom(Utils.ATOM_STSZ);
            stszAtom.entries = samples.map((sample) => sample.size);

            // Sample durations
            let sttsAtom = stblAtom.createAtom(Utils.ATOM_STTS);
            sttsAtom.entities = samples.reduce(Builder.buildDurationsReducer, []).reduce(Builder.compressReducer, []);

            if (track instanceof VideoTrack) {
                // Sample keyframes
                let stssAtom = stblAtom.createAtom(Utils.ATOM_STSS);
                stssAtom.entities = samples.map((s, i) => s.keyframe ? i + 1 : null).filter(v => v !== null);

                // Sample composition offsets
                let cttsAtom = stblAtom.createAtom(Utils.ATOM_CTTS);
                cttsAtom.entities = samples.map((sample) => sample.compositionOffset).reduce(Builder.compressReducer, []);
            }

            // Build chunks
            let chunkSize = 0;
            let samplesCount = 0;
            let offsets = [];
            let chunks = [];
            for (let i = 0, l = samples.length; i < l; i++) {
                let sample = samples[i];
                chunkSize += sample.size;
                samplesCount++;

                if (chunkSize >= MAX_CHUNK_SIZE || i === l - 1) {
                    offsets.push(offsetBase);
                    chunks.push(samplesCount);
                    offsetBase += chunkSize;
                    chunkSize = 0;
                    samplesCount = 0;
                }
            }

            // Chunk offsets
            let offsAtom = null;
            if (offsets[offsets.length - 1] >= MAX_OFFSET_32) {
                offsAtom = stblAtom.createAtom(Utils.ATOM_CO64);
            } else {
                offsAtom = stblAtom.createAtom(Utils.ATOM_STCO);
            }
            offsAtom.entries = offsets;

            // Sample to chunks
            let stscAtom = stblAtom.createAtom(Utils.ATOM_STSC);
            stscAtom.entries = chunks.reduce(Builder.buildSampleToChunksReducer, []);

            // Sample description
            let stsdAtom = stblAtom.createAtom(Utils.ATOM_STSD);
            let codecAtom = null;
            if (codec instanceof CodecH264) {
                codecAtom = stsdAtom.createAtom(Utils.ATOM_AVC1);
            } else if (codec instanceof CodecH265) {
                codecAtom = stsdAtom.createAtom(Utils.ATOM_HEV1);
            } else if (codec instanceof CodecAac) {
                codecAtom = stsdAtom.createAtom(Utils.ATOM_MP4A);
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

        // Generate buffer (don't use allocUnsafe!)
        let buffer = Buffer.alloc(moovAtom.bufferSize());
        moovAtom.build(buffer, 0);

        // Write file
        fs.writeSync(fd, buffer, 0, buffer.length, 0);
    }

    static compressReducer(array, value) {
        if (array.length === 0 || array[array.length - 1] !== value) {
            array.push(1, value);
        } else {
            array[array.length - 2]++;
        }
        return array;
    }

    static buildDurationsReducer(durations, sample, index, samples) {
        durations.push(sample.timestamp - (index > 0 ? samples[index - 1] : 0));
        return durations;
    }

    static buildSampleToChunksReducer(array, value, index, chunks) {
        if (array.length === 0) {
            array.push(1, value, SAMPLE_DESCRIPTION_ID, 2);
        } else if (array[array.length - 3] !== value) {
            array.push(value, SAMPLE_DESCRIPTION_ID, array[array.length - 1] + 1);
        } else {
            array[array.length - 1]++;
        }
        if (index === chunks.length - 1) {
            array = array.slice(0, array.length - 1);
        }
        return array;
    }

}

module.exports = Builder;
