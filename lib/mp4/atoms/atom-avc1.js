'use strict';

const VideoSampleAtom = require('../video-sample-atom');
const Utils = require('../utils');

class AtomAVC1 extends VideoSampleAtom {

    type() {
        return Utils.ATOM_AVC1;
    }

    extraType() {
        return Utils.ATOM_AVCC;
    }

}

module.exports = AtomAVC1;
