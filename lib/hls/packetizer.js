'use strict';

const Fragment = require('../fragment');
const PacketizerImpl = require('./packetizer-impl');

class Packetizer {

    static packetize(fragment, sampleBuffers) {
        if (!(fragment instanceof Fragment)) {
            throw new Error('Argument 1 should be instance of Fragment');
        }
        let packetizer = new PacketizerImpl(fragment, sampleBuffers);
        return packetizer.packFragment();
    }

}

module.exports = Packetizer;
