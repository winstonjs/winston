/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var winston = require('../lib/winston'),
    helpers = require('./helpers');

describe('Exception context', function () {
  it('getProcessInfo()', function () {
    helpers.assertProcessInfo(
      winston.exception.getProcessInfo()
    );
  });

  it('getOsInfo()', function () {
    helpers.assertOsInfo(
      winston.exception.getOsInfo()
    );
  });

  it('getTrace()', function () {
    helpers.assertTrace(
      winston.exception.getTrace(new Error())
    );
  });
});
