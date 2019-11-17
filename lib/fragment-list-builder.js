'use strict';

const VideoSample = require('./video-sample');
const FragmentList = require('./fragment-list');

const FRAGMENT_TIMESCALE = 1000;

class FragmentListBuilder {

    static build(movie, fragmentDuration) {
        let fragmentList = new FragmentList();
        fragmentList.fragmentDuration = fragmentDuration;
        fragmentList.duration = movie.duration * FRAGMENT_TIMESCALE / movie.timescale;
        fragmentList.timescale = FRAGMENT_TIMESCALE;
        let videoTrack = movie.videoTrack();
        if (videoTrack) {
            fragmentList.video = {
                timescale: videoTrack.timescale,
                duration: videoTrack.duration,
                extraData: videoTrack.extraData,
                codec: videoTrack.codec,
                size: videoTrack.size(),
                width: videoTrack.width,
                height: videoTrack.height,
            };
        }
        let audioTrack = movie.audioTrack();
        if (audioTrack) {
            fragmentList.audio = {
                timescale: audioTrack.timescale,
                duration: audioTrack.duration,
                extraData: audioTrack.extraData,
                codec: audioTrack.codec,
                size: audioTrack.size(),
            };
        }

        let timebase = 0;
        let duration = 0;
        let timestamp = 0;
        let fragment = fragmentList.createFragment(0);

        let samples = movie.samples();
        let sample = null;
        let pos = 0;
        let targetFragmentDuration = fragmentList.timescale * fragmentDuration;
        for (let i = 0, l = samples.length; i < l; i++) {
            sample = samples[i];
            if (sample instanceof VideoSample && sample.keyframe) {
                timestamp = fragmentList.timescale * sample.relativeTimestamp();
                duration = timestamp - timebase;
                if (duration >= targetFragmentDuration) {
                    timebase = timestamp;
                    fragment.duration = duration;
                    fragment.samples = samples.slice(pos, i);
                    fragment = fragmentList.createFragment(timestamp);
                    pos = i;
                }
            }
        }
        if (pos < samples.length - 1) {
            fragment.duration = fragmentList.duration - timebase;
            fragment.samples = samples.slice(pos, samples.length);
        }
        fragmentList.chop();

        return fragmentList;
    }

}

module.exports = FragmentListBuilder;
