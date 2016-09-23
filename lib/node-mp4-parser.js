'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var AtomUtil = require('./atom-util');

function readAtom(file, offset) {
    var buffer = new Buffer(AtomUtil.HEADER_SIZE);
    return fs.readAsync(file, buffer, 0, buffer.length, offset).then(function() {
        var size = buffer.readInt32BE();
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
    this.moov = null;
    this.duration = null;

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
                        this.moov = AtomUtil.createAtom(atom.type, atom.size, atom.offset, buffer);
                        return this.moov.parse();
                    }.bind(this));
                } else if (offset + atom.size < this.size) {
                    return readAtoms.call(this, offset + atom.size);
                }
            }.bind(this));
        }.bind(this)(0);
    }.bind(this)).then(function() {
        console.log(this.moov.toString());
        // Return created object
        return this;
    }.bind(this));
};

// Close file
MP4Parser.prototype.close = function() {
    return fs.closeAsync(this.file);
};

module.exports = {
    parse: function(fileName) {
        return new MP4Parser(fileName);
    }
};
