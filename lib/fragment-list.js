'use strict';

const Fragment = require('./fragment');

class FragmentList {

    constructor() {
        this.fragmentDuration = 0;
        this.duration = 0;
        this.timescale = 0;
        this.video = null;
        this.audio = null;
        this.fragments = [];
    }

    createFragment(timestamp) {
        let fragment = {
            timestamp: timestamp,
            duration: 0,
            samples: [],
        };
        this.fragments.push(fragment);
        return fragment;
    }

    chop() {
        if (this.fragments.length > 0 && this.fragments[this.fragments.length - 1].duration === 0) {
            this.fragments.splice(this.fragments.length - 2, 1);
        }
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

    size() {
        return [this.video, this.audio]
            .filter(info => info !== null)
            .reduce((sum, info) => sum + info.size, 0);
    }

    count() {
        return this.fragments.length;
    }

    get(index) {
        let fragment = this.fragments[index];
        if (fragment) {
            let result = new Fragment();
            result.timestamp = fragment.timestamp;
            result.duration = fragment.duration;
            result.samples = fragment.samples;
            result.timescale = this.timescale;
            if (this.video) {
                result.videoExtraData = this.video.extraData;
            }
            if (this.audio) {
                result.audioExtraData = this.audio.extraData;
            }
            return result;
        }
    }

}

module.exports = FragmentList;
