'use strict';

class SampleCounter {

    constructor() {
        this._counters = {};
    }

    next(pid) {
        let counter = this._counters[pid] || 0;
        this._counters[pid] = (counter + 1) & 0xf;
        return counter;
    }

}

module.exports = SampleCounter;
