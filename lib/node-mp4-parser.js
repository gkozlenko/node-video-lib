'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var AtomUtil = require('./atom-util');
var Movie = require('./movie');
var AudioTrack = require('./audio-track');
var VideoTrack = require('./video-track');

function readAtom(file, offset) {
    var buffer = new Buffer(AtomUtil.HEADER_SIZE);
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

var MP4Parser = function(fileName) {
    var moovAtom = null;

    // Open file
    return fs.openAsync(fileName, 'r').then(function(file) {
        // Get and Parse MOOV atom
        return fs.fstatAsync(file).then(function(data) {
            var size = data.size;
            return function readAtoms(offset) {
                return readAtom(file, offset).then(function(atom) {
                    if (atom.type === AtomUtil.ATOM_MOOV) {
                        var buffer = new Buffer(atom.size - AtomUtil.HEADER_SIZE);
                        return fs.readAsync(file, buffer, 0, buffer.length, atom.offset + AtomUtil.HEADER_SIZE).then(function() {
                            // Parse MOOV atom
                            moovAtom = AtomUtil.createAtom(atom.type, atom.size, atom.offset, buffer);
                            return moovAtom.parse();
                        });
                    } else if (offset + atom.size < size) {
                        return readAtoms.call(undefined, offset + atom.size);
                    }
                });
            }(0);
        }).then(function() {
            return fs.closeAsync(file);
        });
    }).then(function() {
        if (!moovAtom) {
            throw new Error('Error: MOOV atom not found');
        }

        // Create movie
        var movie = new Movie();
        var mvhdAtom = moovAtom.getAtom(AtomUtil.ATOM_MVHD);
        if (mvhdAtom) {
            movie.timescale = mvhdAtom.timescale;
            movie.duration = mvhdAtom.duration;
        }

        // Get tracks
        var trakAtoms = moovAtom.getAtoms(AtomUtil.ATOM_TRAK);
        for (var i = 0, l = trakAtoms.length; i < l; i++) {
            var trakAtom = trakAtoms[i];
            var mdiaAtom = trakAtom.getAtom(AtomUtil.ATOM_MDIA);
            if (mdiaAtom !== null) {
                var hdlrAtom = mdiaAtom.getAtom(AtomUtil.ATOM_HDLR);
                var mdhdAtom = mdiaAtom.getAtom(AtomUtil.ATOM_MDHD);
                var minfAtom = mdiaAtom.getAtom(AtomUtil.ATOM_MINF);
                if (hdlrAtom !== null && mdhdAtom !== null && minfAtom !== null) {
                    var stblAtom = minfAtom.getAtom(AtomUtil.ATOM_STBL);
                    if (stblAtom !== null) {
                        var stsdAtom = stblAtom.getAtom(AtomUtil.ATOM_STSD);
                        var track = null;
                        switch (hdlrAtom.handlerType) {
                            case AtomUtil.TRACK_TYPE_AUDIO:
                                var mp4aAtom = stsdAtom.getAtom(AtomUtil.ATOM_MP4A);
                                if (mp4aAtom !== null) {
                                    track = new AudioTrack();
                                    track.channels = mp4aAtom.channels;
                                    track.sampleRate = mp4aAtom.sampleRate;
                                    track.sampleSize = mp4aAtom.sampleSize;
                                    track.extraData = mp4aAtom.extraData;
                                }
                                break;
                            case AtomUtil.TRACK_TYPE_VIDEO:
                                var avc1Atom = stsdAtom.getAtom(AtomUtil.ATOM_AVC1);
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

                            // Get samples
                            var compositions = [];
                            var cttsAtom = stblAtom.getAtom(AtomUtil.ATOM_CTTS);
                            if (cttsAtom !== null) {
                                compositions = cttsAtom.entities;
                            }
                            var sampleSizes = [];
                            var stszAtom = stblAtom.getAtom(AtomUtil.ATOM_STSZ);
                            if (stszAtom !== null) {
                                sampleSizes = stszAtom.entities;
                            }
                            var chunkOffsets = [];
                            var stcoAtom = stblAtom.getAtom(AtomUtil.ATOM_STCO);
                            if (stcoAtom !== null) {
                                chunkOffsets = stcoAtom.entities;
                            } else {
                                var co64Atom = stblAtom.getAtom(AtomUtil.ATOM_CO64);
                                if (co64Atom !== null) {
                                    chunkOffsets = co64Atom.entities;
                                }
                            }
                        }
                    }
                }
            }
        }
        // Return movie object
        return movie;
    });
};

module.exports = {
    parse: function(fileName) {
        return MP4Parser(fileName);
    }
};
