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

        // collection of read operations
        const reads = [];
        let currentRead = null;
        for (let i = 0; i < sampleCount; i++) {
            const entry = entries[i];

            if (!currentRead) {
                currentRead = {
                    start: entry.offset,
                    end: entry.offset + entry.size,
                    entries: [entry],
                };
                reads.push(currentRead);
                continue;
            }

            const endOfCurrentBatch = currentRead.end;
            const gapSize = entry.offset - endOfCurrentBatch;
            const newEnd = entry.offset + entry.size;
            const totalSizeIfMerged = newEnd - currentRead.start;

            if (totalSizeIfMerged <= MAX_BUFFER_SIZE && gapSize <= MAX_GAP_SIZE) {
                currentRead.end = newEnd;
                currentRead.entries.push(entry);
            } else {
                currentRead = {
                    start: entry.offset,
                    end: newEnd,
                    entries: [entry],
                };
                reads.push(currentRead);
            }
        }

        // read data
        const result = new Array(sampleCount);
        const reader = SourceReader.create(source);
        for (let i = 0; i < reads.length; i++) {
            const batch = reads[i];
            const batchSize = batch.end - batch.start;
            const buffer = Buffer.allocUnsafe(batchSize);
            reader.read(buffer, batch.start);

            for (let j = 0, l = batch.entries.length; j < l; j++) {
                const entry = batch.entries[j];
                const start = entry.offset - batch.start;
                const end = start + entry.size;
                result[entry.index] = buffer.subarray(start, end);
            }
        }

        return result;
    }

}

module.exports = FragmentReader;
