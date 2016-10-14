'use strict';

function Packetizer(fragment) {
    this._fragment = fragment;
}

Packetizer.prototype.packetize = function() {

};

Packetizer.prototype.audioExtraData = function() {
    return this._fragment.audioExtraData();
};

Packetizer.prototype.videoExtraData = function() {
    return this._fragment.videoExtraData();
};

Packetizer.prototype.samples = function() {
    return this._fragment.samples();
};

module.exports = Packetizer;
