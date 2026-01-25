'use strict';

const SourceReader = require('./readers/source-reader');

const MAX_BUFFER_SIZE = 524288; // 512Kb
const MAX_GAP_SIZE = 4096; // 4Kb

class FragmentReader {

    /**
     * Read samples
     * @param {Fragment} fragment
     * @param {(int|Buffer)} source
     * @returns {Array}
     */
    static readSamples(fragment, source) {
        const sampleCount = fragment.samples.length;
        if (sampleCount === 0) {
            return [];
        }

        // collect entries sorted by offset
        const entries = new Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
            const sample = fragment.samples[i];
            entries[i] = {
                index: i,
                offset: sample.offset,
                size: sample.size,
            };
        }
        entries.sort((a, b) => a.offset - b.offset);

        const result = new Array(sampleCount);
        const reader = SourceReader.create(source);

        // iterate and process batches immediately
        let batchStartIndex = 0;
        let batchOffsetStart = entries[0].offset;
        let batchOffsetEnd = batchOffsetStart + entries[0].size;

        for (let i = 1; i <= sampleCount; i++) {
            const entry = i < sampleCount ? entries[i] : null;
            let isMergeable = false;

            if (entry) {
                const gapSize = entry.offset - batchOffsetEnd;
                const newEnd = entry.offset + entry.size;
                const totalSizeIfMerged = newEnd - batchOffsetStart;

                if (totalSizeIfMerged <= MAX_BUFFER_SIZE && gapSize <= MAX_GAP_SIZE) {
                    batchOffsetEnd = newEnd;
                    isMergeable = true;
                }
            }

            if (!isMergeable) {
                const batchSize = batchOffsetEnd - batchOffsetStart;
                const buffer = Buffer.allocUnsafe(batchSize);

                reader.read(buffer, batchOffsetStart);

                for (let j = batchStartIndex; j < i; j++) {
                    const batchEntry = entries[j];
                    const offsetStart = batchEntry.offset - batchOffsetStart;
                    const offsetEnd = offsetStart + batchEntry.size;
                    result[batchEntry.index] = buffer.subarray(offsetStart, offsetEnd);
                }

                if (entry) {
                    batchStartIndex = i;
                    batchOffsetStart = entry.offset;
                    batchOffsetEnd = batchOffsetStart + entry.size;
                }
            }
        }

        return result;
    }

}

module.exports = FragmentReader;
