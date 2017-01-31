'use strict';

const Fragment = require('./fragment');

class SimpleFragment {

    constructor() {
        this.timestamp = 0;
        this.duration = 0;
        this.samples = [];
    }

    addSample(sample) {
        this.samples.push(sample);
    }

}

class FragmentList {

    constructor() {
        this.fragmentDuration = 0;
        this.duration = 0;
        this.timescale = 0;
        this.videoExtraData = null;
        this.audioExtraData = null;
        this.width = 0;
        this.height = 0;

        this._fragments = [];
    }

    createFragment(timestamp) {
        let fragment = new SimpleFragment();
        fragment.timestamp = timestamp;
        this._fragments.push(fragment);
        return fragment;
    }

    relativeDuration() {
        if (this.timescale) {
            return this.duration / this.timescale;
        }
        return this.duration || 0;
    }

    resolution() {
        if (this.width && this.height) {
            return `${this.width}x${this.height}`
        }
        return '';
    }

    count() {
        return this._fragments.length;
    }

    get(index) {
        let fragment = this._fragments[index];
        if (fragment) {
            let result = new Fragment();
            result.timestamp = fragment.timestamp;
            result.duration = fragment.duration;
            result.samples = fragment.samples;
            result.timescale = this.timescale;
            result.videoExtraData = this.videoExtraData;
            result.audioExtraData = this.audioExtraData;
            return result;
        }
    }

}

module.exports = FragmentList;
