'use strict';

const VideoLib = require('../index');
const FragmentList = VideoLib.FragmentList;

const chai = require('chai');
const expect = chai.expect;

describe('FragmentList', function () {

    describe('#chop()', function () {
        it('should not change list of fragments when last fragment has duration', function () {
            const fragmentList = new FragmentList();
            let fragment1 = fragmentList.createFragment(0);
            fragment1.duration = 10;
            let fragment2 = fragmentList.createFragment(10);
            fragment2.duration = 20;
            let fragment3 = fragmentList.createFragment(30);
            fragment3.duration = 30;
            fragmentList.chop();

            expect(fragmentList.count()).to.be.equal(3);
            expect(fragmentList.fragments.map(fragment => fragment.duration)).to.deep.equal([10, 20, 30]);
        });

        it('should remove last fragment when it does not have duration', function () {
            const fragmentList = new FragmentList();
            let fragment1 = fragmentList.createFragment(0);
            fragment1.duration = 10;
            let fragment2 = fragmentList.createFragment(10);
            fragment2.duration = 20;
            let fragment3 = fragmentList.createFragment(30);
            fragment3.duration = 0;
            fragmentList.chop();

            expect(fragmentList.count()).to.be.equal(2);
            expect(fragmentList.fragments.map(fragment => fragment.duration)).to.deep.equal([10, 20]);
        });
    });

});
