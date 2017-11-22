'use strict';

const VideoSampleAtom = require('../video-sample-atom');
const Utils = require('../utils');

class AtomHEV1 extends VideoSampleAtom {

    type() {
        return Utils.ATOM_HEV1;
    }

    extraType() {
        return Utils.ATOM_HVCC;
    }

}

module.exports = AtomHEV1;
