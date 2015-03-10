/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

import chai = require('chai');
import fs = require('fs');

var expect = chai.expect;
var tsc = require('..');

describe('CompositeCompilerHost', () => {

	it('Should accept custom lib.d.ts locations', () => {
    var cch = new tsc.CompositeCompilerHost({ defaultLibFilename: 'some/random/lib.d.ts' });

    expect(cch.getDefaultLibFilename()).to.equal('some/random/lib.d.ts');
  });

});
