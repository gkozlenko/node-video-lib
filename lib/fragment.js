'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var MediaUtil = require('./media-util');

var BUFFER_SIZE = 1048576; // 1mb

function Fragment() {
    this._file = null;
    this._timescale = null;
    this._timesample = null;
    this._duration = null;
    this._videoExtraData = null;
    this._audioExtraData = null;
    this._samples = [];
    this._loaded = false;
}

MediaUtil.generateMethods(Fragment.prototype, ['file', 'timescale', 'timesample', 'duration', 'videoExtraData',
    'audioExtraData', 'samples', 'loaded']);

Fragment.prototype.timestamp = function() {
    if (this._timescale) {
        return this._timesample / this._timescale;
    } else {
        return this._timesample;
    }
};

Fragment.prototype.effectiveDuration = function() {
    if (this._timescale) {
        return this._duration / this._timescale;
    }
    return this._duration || 0;
};

Fragment.prototype.addSample = function(sample) {
    this._samples.push(sample);
};

Fragment.prototype.read = function() {
    // Don't read the fragment twice
    if (this._loaded) {
        return new Promise.resolve();
    }
    this._loaded = true;
    // // Simple algorithm of reading segments
    // return Promise.all(this._samples.map(function(sample) {
    //     sample._buffer = new Buffer(sample.size());
    //     return fs.readAsync(this._file, sample._buffer, 0, sample._buffer.length, sample.offset())
    // }.bind(this)));
    var i, l;
    var entries = new Array(this._samples.length);
    for (i = 0, l = this._samples.length; i < l; i++) {
        entries[i] = {
            index: i,
            offset: this._samples[i].offset(),
            size: this._samples[i].size(),
            bufferIndex: 0,
            bufferOffset: 0
        };
    }
    entries.sort(function(ent1, ent2) {
        return ent1.offset - ent2.offset;
    });

    // Get and read buffers
    var buffers = [];
    var promises = [];
    if (entries.length > 0) {
        var entry = entries[0];
        var buffer = {
            offset: entry.offset,
            size: BUFFER_SIZE,
            buffer: new Buffer(BUFFER_SIZE)
        };
        buffers.push(buffer);
        promises.push(fs.readAsync(this._file, buffer.buffer, 0, buffer.size, buffer.offset));
        entry.bufferIndex = buffers.length - 1;
        entry.bufferOffset = 0;
        for (i = 1, l = entries.length; i < l; i++) {
            entry = entries[i];
            if (buffer.offset + buffer.size >= entry.offset + entry.size) {
                entry.bufferIndex = buffers.length - 1;
                entry.bufferOffset = entry.offset - buffer.offset;
            } else {
                buffer = {
                    offset: entry.offset,
                    size: BUFFER_SIZE,
                    buffer: new Buffer(BUFFER_SIZE)
                };
                buffers.push(buffer);
                promises.push(fs.readAsync(this._file, buffer.buffer, 0, buffer.size, buffer.offset));
                entry.bufferIndex = buffers.length - 1;
                entry.bufferOffset = 0;
            }
        }
    }

    return Promise.all(promises).then(function() {
        // Sort by index
        entries.sort(function(ent1, ent2) {
            return ent1.index - ent2.index;
        });
        // Add samples buffers
        for (i = 0, l = this._samples.length; i < l; i++) {
            var sample = this._samples[i];
            var entry = entries[i];
            sample.buffer(buffers[entry.bufferIndex].buffer.slice(entry.bufferOffset, entry.bufferOffset + entry.size));
        }
    }.bind(this));
};

module.exports = Fragment;
