'use strict';

const SourceReader = require('./readers/source-reader');

const BUFFER_SIZE = 1048576; // 1Mb

class FragmentReader {

    /**
     * Read samples
     * @param {Fragment} fragment
     * @param {(int|Buffer)} source
     * @returns {Array}
     */
    static readSamples(fragment, source) {
        // Collect entries
        let entries = fragment.samples.map((sample, i) => {
            return {
                index: i,
                offset: sample.offset,
                size: sample.size,
                bufferIndex: 0,
                bufferOffset: 0,
            };
        }).sort((ent1, ent2) => {
            return ent1.offset - ent2.offset;
        });

        // Build buffers
        let buffers = [];
        let buffer = null;
        for (let i = 0, l = entries.length; i < l; i++) {
            let entry = entries[i];
            if (buffer && buffer.offset + buffer.size >= entry.offset + entry.size) {
                entry.bufferIndex = buffers.length - 1;
                entry.bufferOffset = entry.offset - buffer.offset;
            } else {
                buffer = {
                    offset: entry.offset,
                    size: BUFFER_SIZE,
                    buffer: Buffer.allocUnsafe(BUFFER_SIZE),
                };
                buffers.push(buffer);
                entry.bufferIndex = buffers.length - 1;
                entry.bufferOffset = 0;
            }
        }

        // Load buffers
        let reader = SourceReader.create(source);
        for (let i = 0, l = buffers.length; i < l; i++) {
            let buffer = buffers[i];
            reader.read(buffer.buffer, buffer.offset);
        }

        // Return array of buffers
        entries.sort((ent1, ent2) => {
            return ent1.index - ent2.index;
        });

        return fragment.samples.map((sample, i) => {
            let entry = entries[i];
            return buffers[entry.bufferIndex].buffer.slice(entry.bufferOffset, entry.bufferOffset + entry.size);
        });
    }

}

module.exports = FragmentReader;
