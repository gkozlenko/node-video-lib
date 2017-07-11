'use strict';

const Fragment = require('../fragment');

class Packetizer {

    static packetize(fragment, sampleBuffers) {
        if (!(fragment instanceof Fragment)) {
            throw new Error('Argument 1 should be instance of Fragment');
        }
        let packetizer = new Packetizer(fragment, sampleBuffers);
        return packetizer.packFragment();
    }

    constructor(fragment, sampleBuffers) {
        this.fragment = fragment;
        this.sampleBuffers = sampleBuffers;
    }

    packFragment() {
        return null;
    }

}

module.exports = Packetizer;
