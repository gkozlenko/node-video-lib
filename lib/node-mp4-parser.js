'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var AtomUtil = require('./atom-util');

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
    this.file = null;
    this.size = null;
    this.timescale = null;
    this.duration = null;
    this.tracks = [];

    var moovAtom = null;

    // Open file
    return fs.openAsync(fileName, 'r').then(function(fd) {
        this.file = fd;
    }.bind(this)).then(function() {
        // Get file size
        return fs.fstatAsync(this.file).then(function(data) {
            this.size = data.size;
        }.bind(this));
    }.bind(this)).then(function() {
        // Get and Parse MOOV atom
        return function readAtoms(offset) {
            return readAtom(this.file, offset).then(function(atom) {
                if (atom.type === AtomUtil.ATOM_MOOV) {
                    var buffer = new Buffer(atom.size - AtomUtil.HEADER_SIZE);
                    return fs.readAsync(this.file, buffer, 0, buffer.length, atom.offset + AtomUtil.HEADER_SIZE).then(function() {
                        // Parse MOOV atom
                        moovAtom = AtomUtil.createAtom(atom.type, atom.size, atom.offset, buffer);
                        return moovAtom.parse();
                    }.bind(this));
                } else if (offset + atom.size < this.size) {
                    return readAtoms.call(this, offset + atom.size);
                }
            }.bind(this));
        }.bind(this)(0);
    }.bind(this)).then(function() {
        if (!moovAtom) {
            throw new Error('Error: moov atom not found');
        }
    }.bind(this)).then(function() {
        // Get movie information
        var mvhdAtom = moovAtom.getAtom(AtomUtil.ATOM_MVHD);
        if (mvhdAtom) {
            this.timescale = mvhdAtom.timescale;
            this.duration = mvhdAtom.duration;
        }
    }.bind(this)).then(function() {
        // Return created object
        return this;
    }.bind(this));
};

// Close file
MP4Parser.prototype.close = function() {
    return fs.closeAsync(this.file);
};

// Get video tracks
MP4Parser.prototype.videoTracks = function() {
    return [];
};

// Get audio tracks
MP4Parser.prototype.audioTracks = function() {
    return [];
};

// Get samples sorted by timestamp
MP4Parser.prototype.samples = function(videoTrack, audioTrack) {
    videoTrack = videoTrack || 0;
    audioTrack = audioTrack || 0;
    return [];
};

module.exports = {
    parse: function(fileName) {
        return new MP4Parser(fileName);
    }
};
