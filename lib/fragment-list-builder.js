'use strict';

const VideoSample = require('./video-sample');
const FragmentList = require('./fragment-list');

class FragmentListBuilder {

    static build(movie, fragmentDuration) {
        let fragmentList = new FragmentList();
        fragmentList.fragmentDuration = fragmentDuration;
        fragmentList.duration = movie.duration;
        fragmentList.timescale = movie.timescale;
        let videoTrack = movie.videoTrack();
        if (videoTrack) {
            fragmentList.width = videoTrack.width;
            fragmentList.height = videoTrack.height;
            fragmentList.videoExtraData = videoTrack.extraData;
        }
        let audioTrack = movie.audioTrack();
        if (audioTrack) {
            fragmentList.audioExtraData = audioTrack.extraData;
        }

        let timebase = 0;
        let fragment = fragmentList.createFragment(0);

        for (let i = 0, samples = movie.samples(), l = samples.length; i < l; i++) {
            let sample = samples[i];
            if (sample instanceof VideoSample) {
                let timestamp = movie.timescale * sample.relativeTimestamp();
                let duration = timestamp - timebase;
                fragment.duration = duration;
                if (duration >= movie.timescale * fragmentDuration && sample.keyframe) {
                    timebase = timestamp;
                    fragment = fragmentList.createFragment(timestamp);
                }
            }
            fragment.addSample(sample);
        }
        return fragmentList;
    }

}

module.exports = FragmentListBuilder;
