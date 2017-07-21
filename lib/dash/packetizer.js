'use strict';

const Fragment = require('../fragment');
const FragmentList = require('../fragment-list');

class Packetizer {

    static videoIndex(fragmentList) {
        if (!(fragmentList instanceof FragmentList)) {
            throw new Error('Argument 1 should be instance of FragmentList');
        }
        return null;
    }

    static audioIndex(fragmentList) {
        if (!(fragmentList instanceof FragmentList)) {
            throw new Error('Argument 1 should be instance of FragmentList');
        }
        return null;
    }

    static videoPacker(fragment, sampleBuffers) {
        if (!(fragment instanceof Fragment)) {
            throw new Error('Argument 1 should be instance of Fragment');
        }
        return null;
    }

    static audioPacker(fragment, sampleBuffers) {
        if (!(fragment instanceof Fragment)) {
            throw new Error('Argument 1 should be instance of Fragment');
        }
        return null;
    }

}

module.exports = Packetizer;
