'use strict';

const AudioSample = require('./audio-sample');
const VideoSample = require('./video-sample');
const FragmentList = require('./fragment-list');

class FragmentListBuilder {

    static build(movie, fragmentDuration) {
        const fragmentList = new FragmentList();
        fragmentList.fragmentDuration = fragmentDuration;

        const videoTrack = movie.videoTrack();
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

        const audioTrack = movie.audioTrack();
        if (audioTrack) {
            fragmentList.audio = {
                timescale: audioTrack.timescale,
                duration: audioTrack.duration,
                extraData: audioTrack.extraData,
                codec: audioTrack.codec,
                size: audioTrack.size(),
            };
        }

        // choose fragment list timescale in order to have integer timestamps
        fragmentList.timescale = movie.timescale;
        if (videoTrack) {
            fragmentList.timescale = videoTrack.timescale;
        } else if (audioTrack) {
            fragmentList.timescale = audioTrack.timescale;
        }

        const samples = movie.samples();
        if (samples.length === 0) {
            return fragmentList;
        }

        let timebase = fragmentList.timescale * samples[0].timestamp / samples[0].timescale;
        let duration = 0;
        let timestamp = -1;
        let fragment = fragmentList.createFragment(timebase);

        let pos = 0;
        let sample = null;
        let prevSampleVideoTimestamp = -1;
        let prevSampleAudioTimestamp = -1;
        const targetFragmentDuration = fragmentList.timescale * fragmentDuration;
        for (let i = 0, l = samples.length; i < l; i++) {
            // remember previous sample timestamp
            if (sample !== null) {
                if (sample instanceof VideoSample) {
                    prevSampleVideoTimestamp = timestamp;
                } else {
                    prevSampleAudioTimestamp = timestamp;
                }
            }

            sample = samples[i];
            timestamp = fragmentList.timescale * sample.timestamp / sample.timescale;
            if (!videoTrack || (sample instanceof VideoSample && sample.keyframe)) {
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

        if (pos < samples.length) {
            // take into account last sample duration
            sample = samples[samples.length - 1];
            if (sample instanceof VideoSample && prevSampleVideoTimestamp !== -1) {
                timestamp += timestamp - prevSampleVideoTimestamp;
            } else if (sample instanceof AudioSample && prevSampleAudioTimestamp !== -1) {
                timestamp += timestamp - prevSampleAudioTimestamp;
            }
            fragment.duration = timestamp - timebase;
            fragment.samples = samples.slice(pos, samples.length);
        }
        fragmentList.chop();

        // update fragment list duration
        fragmentList.duration = Math.ceil(timestamp);

        return fragmentList;
    }

}

module.exports = FragmentListBuilder;
