'use strict';

const VideoSampleAtom = require('../video-sample-atom');
const Utils = require('../utils');

class AtomHVC1 extends VideoSampleAtom {

    type() {
        return Utils.ATOM_HVC1;
    }

    extraType() {
        return Utils.ATOM_HVCC;
    }

}

module.exports = AtomHVC1;
