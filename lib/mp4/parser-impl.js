'use strict';

const Utils = require('./utils');
const Movie = require('../movie');
const AudioTrack = require('../audio-track');
const VideoTrack = require('../video-track');
const AudioSample = require('../audio-sample');
const VideoSample = require('../video-sample');
const SourceReader = require('../readers/source-reader');
const CodecParser = require('../codecs/parser');
const BufferUtils = require('../buffer-utils');

class ParserImpl {

    constructor(source) {
        this.source = source;
        this.reader = SourceReader.create(this.source);
    }

    parse() {
        // Get moov atom
        this._findMoovAtom();

        // Create movie
        this._createMovie();

        // Create tracks
        let trakAtoms = this.moovAtom.getAtoms(Utils.ATOM_TRAK);
        for (let trakAtom of trakAtoms) {
            this._createTrack(trakAtom);
        }

        // Complete movie object
        this.movie.tracks.forEach((track) => {
            track.sortSamples();
            track.ensureDuration();
        });
        this.movie.ensureDuration();

        // Return movie object
        return this.movie;
    }

    _findMoovAtom() {
        this.moovAtom = null;

        let pos = 0;
        let size = this.reader.size();
        let buffer = Buffer.allocUnsafe(8);
        while (pos < size) {
            this.reader.read(buffer, pos);
            let headerSize = 8;
            let atomSize = buffer.readUInt32BE(0);
            let atomType = buffer.toString('ascii', 4);
            if (atomSize === 0) {
                atomSize = size - pos;
            } else if (atomSize === 1) {
                this.reader.read(buffer, pos + buffer.length);
                atomSize = BufferUtils.readUInt64BE(buffer, 0);
                headerSize += 8;
            }
            if (Utils.ATOM_MOOV === atomType) {
                let buffer = Buffer.allocUnsafe(atomSize - headerSize);
                if (this.reader.read(buffer, pos + headerSize) === buffer.length) {
                    this.moovAtom = Utils.createAtom(atomType);
                    this.moovAtom.parse(buffer);
                    break;
                }
            } else {
                pos += atomSize;
            }
        }

        if (!this.moovAtom) {
            throw new Error('MOOV atom not found');
        }
    }

    _createMovie() {
        // Create movie
        this.movie = new Movie();

        // Add meta information
        let mvhdAtom = this.moovAtom.getAtom(Utils.ATOM_MVHD);
        if (mvhdAtom) {
            this.movie.timescale = mvhdAtom.timescale;
            this.movie.duration = mvhdAtom.duration;
        }
    }

    _createTrack(trakAtom) {
        let mdiaAtom = trakAtom.getAtom(Utils.ATOM_MDIA);
        if (mdiaAtom === null) {
            return;
        }

        let hdlrAtom = mdiaAtom.getAtom(Utils.ATOM_HDLR);
        let mdhdAtom = mdiaAtom.getAtom(Utils.ATOM_MDHD);
        let minfAtom = mdiaAtom.getAtom(Utils.ATOM_MINF);
        if (hdlrAtom === null || mdhdAtom === null || minfAtom === null) {
            return;
        }

        let stblAtom = minfAtom.getAtom(Utils.ATOM_STBL);
        if (stblAtom === null) {
            return;
        }

        let stsdAtom = stblAtom.getAtom(Utils.ATOM_STSD);
        let track = null;
        let samplePrototype = null;

        if (Utils.TRACK_TYPE_AUDIO === hdlrAtom.handlerType) {
            let audioAtom = stsdAtom.getAudioAtom();
            if (audioAtom !== null) {
                track = new AudioTrack();
                samplePrototype = AudioSample.prototype;
                track.channels = audioAtom.channels;
                track.sampleRate = audioAtom.sampleRate;
                track.sampleSize = audioAtom.sampleSize;
                track.extraData = audioAtom.extraData;
            }
        } else if (Utils.TRACK_TYPE_VIDEO === hdlrAtom.handlerType) {
            let videoAtom = stsdAtom.getVideoAtom();
            if (videoAtom !== null) {
                track = new VideoTrack();
                samplePrototype = VideoSample.prototype;
                track.width = videoAtom.width;
                track.height = videoAtom.height;
                track.extraData = videoAtom.extraData;
            }
        }

        if (track === null) {
            return;
        }

        track.duration = mdhdAtom.duration;
        track.timescale = mdhdAtom.timescale;
        let codecInfo = CodecParser.parse(track.extraData);
        if (codecInfo !== null) {
            track.codec = codecInfo.codec();
        }

        // Get needed data to build samples
        let compositions = ParserImpl._getEntries(stblAtom, Utils.ATOM_CTTS);
        let sampleSizes = ParserImpl._getEntries(stblAtom, Utils.ATOM_STSZ);
        let samplesToChunk = ParserImpl._getEntries(stblAtom, Utils.ATOM_STSC);
        let syncSamples = ParserImpl._getEntries(stblAtom, Utils.ATOM_STSS);
        let timeSamples = ParserImpl._getEntries(stblAtom, Utils.ATOM_STTS);
        let chunkOffsets = ParserImpl._getEntries(stblAtom, Utils.ATOM_STCO);
        if (chunkOffsets.length === 0) {
            chunkOffsets = ParserImpl._getEntries(stblAtom, Utils.ATOM_CO64);
        }

        let currentTimestamp = 0;
        let currentChunk = 0;
        let currentChunkOffset = 0;
        let currentChunkNumbers = 0;
        let currentSampleChunk = 0;
        let currentCompositionIndex = 0;
        let currentCompositionCount = 0;
        let index = 0;
        let indexKeyframe = 0;
        let samplesPerChunk = 0;
        if (samplesToChunk.length > 0) {
            currentSampleChunk = samplesToChunk[0];
            samplesPerChunk = samplesToChunk[1];
        }

        // Build samples
        let samples = new Array(sampleSizes.length);
        let pos = 0;
        for (let i = 0, l = timeSamples.length; i < l; i += 2) {
            let sampleDuration = timeSamples[i + 1] || 0;
            for (let j = 0; j < timeSamples[i]; j++) {
                let sample = Object.create(samplePrototype);
                sample.timestamp = currentTimestamp;
                sample.timescale = track.timescale;
                sample.size = sampleSizes[index];
                sample.offset = chunkOffsets[currentChunk] + currentChunkOffset;
                if (track instanceof VideoTrack) {
                    let compositionOffset = 0;
                    if (2 * currentCompositionIndex + 1 < compositions.length) {
                        compositionOffset = compositions[2 * currentCompositionIndex + 1] || 0;
                        currentCompositionCount++;
                        if (currentCompositionCount >= compositions[2 * currentCompositionIndex]) {
                            currentCompositionIndex++;
                            currentCompositionCount = 0;
                        }
                    }
                    sample.compositionOffset = compositionOffset;
                    if (indexKeyframe < syncSamples.length && syncSamples[indexKeyframe] === index + 1) {
                        sample.keyframe = true;
                        indexKeyframe++;
                    } else {
                        sample.keyframe = false;
                    }
                }
                if (sample.size > 0) {
                    samples[pos++] = sample;
                }

                currentChunkNumbers++;
                if (currentChunkNumbers < samplesPerChunk) {
                    currentChunkOffset += sampleSizes[index];
                } else {
                    currentChunkNumbers = 0;
                    currentChunkOffset = 0;
                    currentChunk++;
                    if (currentSampleChunk * 3 + 1 < samplesToChunk.length) {
                        if (currentChunk + 1 >= samplesToChunk[3 * currentSampleChunk]) {
                            samplesPerChunk = samplesToChunk[3 * currentSampleChunk + 1];
                            currentSampleChunk++;
                        }
                    }
                }

                currentTimestamp += sampleDuration;
                index++;
            }
        }

        if (pos < samples.length) {
            track.samples = samples.slice(0, pos);
        } else {
            track.samples = samples;
        }

        if (track.extraData && track.samples.length > 0) {
            this.movie.addTrack(track);
        }
    }

    static _getEntries(stblAtom, type) {
        let entries = [];
        let atom = stblAtom.getAtom(type);
        if (atom !== null) {
            entries = atom.entries;
        }
        return entries;
    }

}

module.exports = ParserImpl;
