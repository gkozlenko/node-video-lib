'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var Parser = require('./parser');
var util = require('util');

var MediaUtil = require('../media-util');
var Movie = require('../movie');
var VideoTrack = require('../video-track');
var AudioTrack = require('../audio-track');

function readAtom(file, offset) {
    var buffer = new Buffer(MediaUtil.HEADER_SIZE);
    return fs.readAsync(file, buffer, 0, buffer.length, offset).then(function() {
        var size = buffer.readUInt32BE();
        var type = buffer.toString('ascii', 4);
        return {
            type: type,
            size: size,
            offset: offset
        };
    });
}

function getMoovAtom(file, offset, size) {
    return readAtom(file, offset).then(function(atom) {
        if (atom.type === MediaUtil.ATOM_MOOV) {
            var buffer = new Buffer(atom.size - MediaUtil.HEADER_SIZE);
            return fs.readAsync(file, buffer, 0, buffer.length, atom.offset + MediaUtil.HEADER_SIZE).then(function() {
                var moovAtom = MediaUtil.createAtom(atom.type, atom.size, atom.offset, buffer);
                moovAtom.parse();
                return moovAtom;
            });
        } else if (offset + atom.size < size) {
            return getMoovAtom(file, offset + atom.size, size);
        }
    });
}

function ParserMp4() {
    Parser.apply(this, Array.prototype.slice.call(arguments));
}

util.inherits(ParserMp4, Parser);

ParserMp4.prototype.parse = function() {
    // Open file
    return fs.openAsync(this._fileName, 'r').then(function(file) {
        // Get and Parse MOOV atom
        return fs.fstatAsync(file).then(function(data) {
            return getMoovAtom(file, 0, data.size);
        }).then(function(moovAtom) {
            if (!moovAtom) {
                throw new Error('Error: MOOV atom not found');
            }

            // Create movie
            var movie = new Movie();
            movie.file(file);
            var mvhdAtom = moovAtom.getAtom(MediaUtil.ATOM_MVHD);
            if (mvhdAtom) {
                movie.timescale(mvhdAtom.timescale);
                movie.duration(mvhdAtom.duration);
            }

            // Get tracks
            var trakAtoms = moovAtom.getAtoms(MediaUtil.ATOM_TRAK);
            for (var i = 0, il = trakAtoms.length; i < il; i++) {
                var trakAtom = trakAtoms[i];
                var mdiaAtom = trakAtom.getAtom(MediaUtil.ATOM_MDIA);
                if (mdiaAtom !== null) {
                    var hdlrAtom = mdiaAtom.getAtom(MediaUtil.ATOM_HDLR);
                    var mdhdAtom = mdiaAtom.getAtom(MediaUtil.ATOM_MDHD);
                    var minfAtom = mdiaAtom.getAtom(MediaUtil.ATOM_MINF);
                    if (hdlrAtom !== null && mdhdAtom !== null && minfAtom !== null) {
                        var stblAtom = minfAtom.getAtom(MediaUtil.ATOM_STBL);
                        if (stblAtom !== null) {
                            var stsdAtom = stblAtom.getAtom(MediaUtil.ATOM_STSD);
                            var track = null;
                            switch (hdlrAtom.handlerType) {
                                case MediaUtil.TRACK_TYPE_AUDIO:
                                    var mp4aAtom = stsdAtom.getAtom(MediaUtil.ATOM_MP4A);
                                    if (mp4aAtom !== null) {
                                        track = new AudioTrack();
                                        track.channels(mp4aAtom.channels);
                                        track.sampleRate(mp4aAtom.sampleRate);
                                        track.sampleSize(mp4aAtom.sampleSize);
                                        track.extraData(mp4aAtom.extraData);
                                    }
                                    break;
                                case MediaUtil.TRACK_TYPE_VIDEO:
                                    var avc1Atom = stsdAtom.getAtom(MediaUtil.ATOM_AVC1);
                                    if (avc1Atom !== null) {
                                        track = new VideoTrack();
                                        track.width(avc1Atom.width);
                                        track.height(avc1Atom.height);
                                        track.extraData(avc1Atom.extraData);
                                    }
                                    break;
                            }

                            if (track !== null) {
                                track.duration(mdhdAtom.duration);
                                track.timescale(mdhdAtom.timescale);
                                movie.addTrack(track);

                                // Get needed data to build samples
                                var compositions = [];
                                var cttsAtom = stblAtom.getAtom(MediaUtil.ATOM_CTTS);
                                if (cttsAtom !== null) {
                                    compositions = cttsAtom.entries;
                                }
                                var sampleSizes = [];
                                var stszAtom = stblAtom.getAtom(MediaUtil.ATOM_STSZ);
                                if (stszAtom !== null) {
                                    sampleSizes = stszAtom.entries;
                                }
                                var chunkOffsets = [];
                                var stcoAtom = stblAtom.getAtom(MediaUtil.ATOM_STCO);
                                if (stcoAtom !== null) {
                                    chunkOffsets = stcoAtom.entries;
                                } else {
                                    var co64Atom = stblAtom.getAtom(MediaUtil.ATOM_CO64);
                                    if (co64Atom !== null) {
                                        chunkOffsets = co64Atom.entries;
                                    }
                                }
                                var samplesToChunk = [];
                                var stscAtom = stblAtom.getAtom(MediaUtil.ATOM_STSC);
                                if (stscAtom !== null) {
                                    samplesToChunk = stscAtom.entries;
                                }
                                var syncSamples = [];
                                var stssAtom = stblAtom.getAtom(MediaUtil.ATOM_STSS);
                                if (stssAtom !== null) {
                                    syncSamples = stssAtom.entries;
                                }
                                var timeSamples = [];
                                var sttsAtom = stblAtom.getAtom(MediaUtil.ATOM_STTS);
                                if (sttsAtom !== null) {
                                    timeSamples = sttsAtom.entries;
                                }

                                var currentTimesample = 0;
                                var currentChunk = 0;
                                var currentChunkOffset = 0;
                                var currentChunkNumbers = 0;
                                var currentSampleChunk = 0;
                                var index = 0;
                                var indexKeyframe = 0;
                                var samplesPerChunk = 0;
                                if (currentSampleChunk * 3 < samplesToChunk.length) {
                                    samplesPerChunk = samplesToChunk[3 * currentSampleChunk + 1];
                                    currentSampleChunk = 1;
                                }
                                for (var j = 0, jl = timeSamples.length; j < jl; j += 2) {
                                    var delta = timeSamples[j + 1];
                                    for (var c = 0, cl = timeSamples[j]; c < cl; c++) {
                                        var sampleSize = sampleSizes[index];

                                        var sample = track.createSample();
                                        sample.timesample(currentTimesample);
                                        sample.timescale(track.timescale());
                                        sample.size(sampleSize);
                                        sample.offset(chunkOffsets[currentChunk] + currentChunkOffset);

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
                                                sample.compositionOffset(compositions[index]);
                                            }
                                            if (indexKeyframe < syncSamples.length && syncSamples[indexKeyframe] === index + 1) {
                                                sample.keyframe(true);
                                                indexKeyframe++;
                                            }
                                        }

                                        currentTimesample += delta;
                                        index++;

                                        if (sample.size() > 0) {
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
        }).catch(function(err) {
            return fs.closeAsync(file).finally(function() {
                throw err;
            });
        });
    });
};

module.exports = ParserMp4;
