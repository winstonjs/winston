'use strict';

/*
 * common.test.js: Tests for lib/winston/common.js
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const winston = require('../lib/winston');

describe('winston/common', () => {
  it('winston.paddings', () => {
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
