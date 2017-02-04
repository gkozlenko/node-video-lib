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
        let duration = 0;
        let fragment = fragmentList.createFragment(0);

        let samples = movie.samples();
        let pos = 0;
        let targetFragmentDuration = movie.timescale * fragmentDuration;
        for (let i = 0, l = samples.length; i < l; i++) {
            let sample = samples[i];
            if (sample instanceof VideoSample) {
                let timestamp = movie.timescale * sample.relativeTimestamp();
                duration = timestamp - timebase;
                if (sample.keyframe && duration >= targetFragmentDuration) {
                    timebase = timestamp;
                    fragment.duration = duration;
                    fragment.samples = samples.slice(pos, i);
                    fragment = fragmentList.createFragment(timestamp);
                    pos = i;
                }
            }
        }
        if (pos < samples.length - 1) {
            fragment.duration = duration;
            fragment.samples = samples.slice(pos, samples.length);
        }
        return fragmentList;
    }

}

module.exports = FragmentListBuilder;
