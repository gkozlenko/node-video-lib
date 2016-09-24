'use strict';

var util = require('util');
var AtomUtil = require('../atom-util');
var ContainerAtom = require('../container-atom');

function AtomSTBL() {
    ContainerAtom.apply(this, Array.prototype.slice.call(arguments));

    this.availableAtoms = [];
}

util.inherits(AtomSTBL, ContainerAtom);

module.exports = AtomSTBL;
