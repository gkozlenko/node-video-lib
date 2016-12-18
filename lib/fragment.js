'use strict';

const fs = require('fs');

const BUFFER_SIZE = 1048576; // 1Mb

class Fragment {

    constructor() {
        this.timestamp = null;
        this.duration = null;
        this.timescale = null;
        this.videoExtraData = null;
        this.audioExtraData = null;
        this.samples = [];
        this._loaded = false;
    }

    relativeTimestamp() {
        if (this.timescale) {
            return this.timestamp / this.timescale;
        } else {
            return this.timestamp;
        }
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

    addSample(sample) {
        this.samples.push(sample);
    }

    readSamples(file) {
        if (this._loaded) {
            return;
        }
        this._loaded = true;

        // Collect entries
        let entries = this.samples.map((sample, i) => {
            return {
                index: i,
                offset: sample.offset,
                size: sample.size,
                bufferIndex: 0,
                bufferOffset: 0
            }
        }).sort((ent1, ent2) => {
            return ent1.offset - ent2.offset;
        });

        // Build buffers
        let buffers = [];
        let buffer = null;
        for (let entry of entries) {
            if (buffer && buffer.offset + buffer.size >= entry.offset + entry.size) {
                entry.bufferIndex = buffers.length - 1;
                entry.bufferOffset = entry.offset - buffer.offset;
            } else {
                buffer = {
                    offset: entry.offset,
                    size: BUFFER_SIZE,
                    buffer: new Buffer(BUFFER_SIZE)
                };
                buffers.push(buffer);
                entry.bufferIndex = buffers.length - 1;
                entry.bufferOffset = 0;
            }
        }

        // Load buffers
        for (let buffer of buffers) {
            fs.readSync(file, buffer.buffer, 0, buffer.size, buffer.offset);
        }

        // Add buffers to samples
        entries.sort((ent1, ent2) => {
            return ent1.index - ent2.index;
        });
        this.samples.map((sample, i) => {
            let entry = entries[i];
            sample.buffer = buffers[entry.bufferIndex].buffer.slice(entry.bufferOffset, entry.bufferOffset + entry.size);
        });
    }

}

module.exports = Fragment;
