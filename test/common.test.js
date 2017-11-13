/*
 * common.test.js: Tests for lib/winston/common.js
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assume = require('assume'),
    winston = require('../lib/winston'),
    common = require('../lib/winston/common');


describe('winston/common', function () {
  it('winston.paddings', function () {
    assume(winston.paddings).is.an('object');
    assume(winston.paddings).deep.equals({
      error: '  ',
      warn: '   ',
      info: '   ',
      http: '   ',
      verbose: '',
      debug: '  ',
      silly: '  '
    });
  });
});
