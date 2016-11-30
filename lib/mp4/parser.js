'use strict';

const fs = require('fs');
const Movie = require('../movie');
const AudioTrack = require('../audio-track');
const VideoTrack = require('../video-track');
const Utils = require('./utils');

class Parser {

    static parse(file) {
        // Get moov atom
        let moovAtom = Parser._getMoovAtom(file);
        if (!moovAtom) {
            throw new Error('MOOV atom not found');
        }

        // Create movie
        let movie = new Movie(file);

        // Add meta information
        let mvhdAtom = moovAtom.getAtom(Utils.ATOM_MVHD);
        if (mvhdAtom) {
            movie.timescale = mvhdAtom.timescale;
            movie.duration = mvhdAtom.duration;
        }

        // Get tracks
        let trakAtoms = moovAtom.getAtoms(Utils.ATOM_TRAK);
        for (let trakAtom of trakAtoms) {
            let mdiaAtom = trakAtom.getAtom(Utils.ATOM_MDIA);
            if (mdiaAtom !== null) {
                let hdlrAtom = mdiaAtom.getAtom(Utils.ATOM_HDLR);
                let mdhdAtom = mdiaAtom.getAtom(Utils.ATOM_MDHD);
                let minfAtom = mdiaAtom.getAtom(Utils.ATOM_MINF);
                if (hdlrAtom !== null && mdhdAtom !== null && minfAtom !== null) {
                    let stblAtom = minfAtom.getAtom(Utils.ATOM_STBL);
                    if (stblAtom !== null) {
                        let stsdAtom = stblAtom.getAtom(Utils.ATOM_STSD);
                        let track = null;
                        switch (hdlrAtom.handlerType) {
                            case Utils.TRACK_TYPE_AUDIO:
                                let mp4aAtom = stsdAtom.getAtom(Utils.ATOM_MP4A);
                                if (mp4aAtom !== null) {
                                    track = new AudioTrack();
                                    track.channels = mp4aAtom.channels;
                                    track.sampleRate = mp4aAtom.sampleRate;
                                    track.sampleSize = mp4aAtom.sampleSize;
                                    track.extraData = mp4aAtom.extraData;
                                }
                                break;
                            case Utils.TRACK_TYPE_VIDEO:
                                let avc1Atom = stsdAtom.getAtom(Utils.ATOM_AVC1);
                                if (avc1Atom !== null) {
                                    track = new VideoTrack();
                                    track.width = avc1Atom.width;
                                    track.height = avc1Atom.height;
                                    track.extraData = avc1Atom.extraData;
                                }
                                break;
                        }

                        if (track !== null) {
                            track.duration = mdhdAtom.duration;
                            track.timescale = mdhdAtom.timescale;
                            movie.addTrack(track);

                            // Get needed data to build samples
                            let compositions = [];
                            let cttsAtom = stblAtom.getAtom(Utils.ATOM_CTTS);
                            if (cttsAtom !== null) {
                                compositions = cttsAtom.entries;
                            }
                            let sampleSizes = [];
                            let stszAtom = stblAtom.getAtom(Utils.ATOM_STSZ);
                            if (stszAtom !== null) {
                                sampleSizes = stszAtom.entries;
                            }
                            let chunkOffsets = [];
                            let stcoAtom = stblAtom.getAtom(Utils.ATOM_STCO);
                            if (stcoAtom !== null) {
                                chunkOffsets = stcoAtom.entries;
                            } else {
                                let co64Atom = stblAtom.getAtom(Utils.ATOM_CO64);
                                if (co64Atom !== null) {
                                    chunkOffsets = co64Atom.entries;
                                }
                            }
                            let samplesToChunk = [];
                            let stscAtom = stblAtom.getAtom(Utils.ATOM_STSC);
                            if (stscAtom !== null) {
                                samplesToChunk = stscAtom.entries;
                            }
                            let syncSamples = [];
                            let stssAtom = stblAtom.getAtom(Utils.ATOM_STSS);
                            if (stssAtom !== null) {
                                syncSamples = stssAtom.entries;
                            }
                            let timeSamples = [];
                            let sttsAtom = stblAtom.getAtom(Utils.ATOM_STTS);
                            if (sttsAtom !== null) {
                                timeSamples = sttsAtom.entries;
                            }

                            let currentTimestamp = 0;
                            let currentChunk = 0;
                            let currentChunkOffset = 0;
                            let currentChunkNumbers = 0;
                            let currentSampleChunk = 0;
                            let index = 0;
                            let indexKeyframe = 0;
                            let samplesPerChunk = 0;
                            if (currentSampleChunk * 3 < samplesToChunk.length) {
                                samplesPerChunk = samplesToChunk[3 * currentSampleChunk + 1];
                                currentSampleChunk = 1;
                            }
                            for (let j = 0, jl = timeSamples.length; j < jl; j += 2) {
                                let delta = timeSamples[j + 1];
                                for (let c = 0, cl = timeSamples[j]; c < cl; c++) {
                                    let sampleSize = sampleSizes[index];

                                    let sample = track.createSample();
                                    sample.timestamp = currentTimestamp;
                                    sample.timescale = track.timescale;
                                    sample.size = sampleSize;
                                    sample.offset = chunkOffsets[currentChunk] + currentChunkOffset;

                                    if (++currentChunkNumbers < samplesPerChunk) {
                                        currentChunkOffset = sampleSize;
                                    } else {
                                        currentChunkNumbers = 0;
                                        currentChunkOffset = 0;
                                        if (currentSampleChunk * 3 + 1 < samplesToChunk.length) {
                                            if (++currentChunk + 1 >= samplesToChunk[3 * currentSampleChunk]) {
                                                samplesPerChunk = samplesToChunk[3 * currentSampleChunk + 1];
                                                currentSampleChunk++;
                                            }
                                        } else {
                                            currentChunk++;
                                        }
                                    }

                                    if (track instanceof VideoTrack) {
                                        if (compositions.length > 0) {
                                            sample.compositionOffset = compositions[index];
                                        }
                                        if (indexKeyframe < syncSamples.length && syncSamples[indexKeyframe] === index + 1) {
                                            sample.keyframe = true;
                                            indexKeyframe++;
                                        }
                                    }

                                    currentTimestamp += delta;
                                    index++;

                                    if (sample.size > 0) {
                                        track.addSample(sample);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Return movie object
        return movie;
    }

    static _getMoovAtom(file) {
        return (function find(offset, size) {
            let atom = Parser._readAtom(file, offset);
            if (atom) {
                if (atom.type === Utils.ATOM_MOOV) {
                    let buffer = new Buffer(atom.size - 8);
                    let read = fs.readSync(file, buffer, 0, buffer.length, atom.offset + 8);
                    if (read === buffer.length) {
                        let moovAtom = Utils.createAtom(atom.type, atom.size, atom.offset, buffer);
                        moovAtom.parse();
                        return moovAtom;
                    } else {
                        return null;
                    }
                } else if (offset + atom.size < size) {
                    return find(offset + atom.size, size);
                }
            }
            return null;
        })(0, fs.fstatSync(file).size);
    }

    static _readAtom(file, offset) {
        let buffer = new Buffer(8);
        let read = fs.readSync(file, buffer, 0, buffer.length, offset);
        if (read === buffer.length) {
            let size = buffer.readUInt32BE();
            let type = buffer.toString('ascii', 4);
            return {
                type: type,
                size: size,
                offset: offset
            };
        }
        return null;
    }

}

module.exports = Parser;
