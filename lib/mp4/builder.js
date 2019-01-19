'use strict';

const fs = require('fs');

const Utils = require('./utils');
const VideoTrack = require('../video-track');

const MAX_OFFSET_32 = 0xefffffff;

class Builder {

    /**
     * Build MP4 file
     * @param {Movie} movie
     * @param {int} fd
     * @returns {boolean}
     */
    static build(movie, fd) {
        // Generate atoms structure
        let moovAtom = Utils.createAtom(Utils.ATOM_MOOV);

        // Movie header
        let mvhdAtom = moovAtom.createAtom(Utils.ATOM_MVHD);
        mvhdAtom.duration = movie.duration;
        mvhdAtom.timescale = movie.timescale;
        mvhdAtom.nextTrackId = 1;

        // Tracks
        for (let track of [movie.videoTrack(), movie.audioTrack()].filter(track => track !== null)) {
            mvhdAtom.nextTrackId++;
            let trakAtom = moovAtom.createAtom(Utils.ATOM_TRAK);
            let mdiaAtom = trakAtom.createAtom(Utils.ATOM_MDIA);
            let mdhdAtom = mdiaAtom.createAtom(Utils.ATOM_MDHD);
            mdhdAtom.duration = track.duration;
            mdhdAtom.timescale = track.timescale;
            let hdlrAtom = mdiaAtom.createAtom(Utils.ATOM_HDLR);
            let minfAtom = mdiaAtom.createAtom(Utils.ATOM_MINF);
            if (track instanceof VideoTrack) {
                hdlrAtom.handlerType = Utils.TRACK_TYPE_VIDEO;
                hdlrAtom.componentName = Utils.COMPONENT_NAME_VIDEO;
                minfAtom.createAtom(Utils.ATOM_VMHD);
            } else {
                hdlrAtom.handlerType = Utils.TRACK_TYPE_AUDIO;
                hdlrAtom.componentName = Utils.COMPONENT_NAME_AUDIO;
                minfAtom.createAtom(Utils.ATOM_SMHD);
            }
            let stblAtom = minfAtom.createAtom(Utils.ATOM_STBL);

            // Samples
            let samples = track.samples.slice();
            samples.sort((sample1, sample2) => sample1.offset - sample2.offset);
            let stszAtom = stblAtom.createAtom(Utils.ATOM_STSZ);
            stszAtom.entries = samples.map((sample) => sample.size);
            let offsAtom = null;
            if (movie.size() >= MAX_OFFSET_32) {
                offsAtom = stblAtom.createAtom(Utils.ATOM_CO64);
            } else {
                offsAtom = stblAtom.createAtom(Utils.ATOM_STCO);
            }
            offsAtom.entries = samples.map((sample) => sample.offset);
            let sttsAtom = stblAtom.createAtom(Utils.ATOM_STTS);
            sttsAtom.entities = samples.reduce((durations, sample, index, samples) => {
                durations.push(sample.timestamp - (index > 0 ? samples[index - 1] : 0));
                return durations;
            }, []).reduce(Builder.compressReducer, []);
            if (track instanceof VideoTrack) {
                let stssAtom = stblAtom.createAtom(Utils.ATOM_STSS);
                stssAtom.entities = samples.map((s, i) => s.keyframe ? i + 1 : null).filter(v => v !== null);
                let cttsAtom = stblAtom.createAtom(Utils.ATOM_CTTS);
                cttsAtom.entities = samples.map((sample) => sample.compositionOffset).reduce(Builder.compressReducer, []);
            }
        }

        // Generate buffer (don't use allocUnsafe!)
        let buffer = Buffer.alloc(moovAtom.bufferSize());
        moovAtom.build(buffer, 0);

        // Write file
        fs.writeSync(fd, buffer, 0, buffer.length, 0);
    }

    static compressReducer(array, value) {
        if (array.length === 0 || array[array.length - 1] !== value) {
            array.push(1, value);
        } else {
            array[array.length - 2]++;
        }
        return array;
    }

}

module.exports = Builder;
