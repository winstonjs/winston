/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var winston = require('../lib/winston'),
    helpers = require('./helpers');

describe('ExceptionHandler', function () {
  var logger = new winston.LogStream();
  var handler = new winston.ExceptionHandler(logger);

  it('.getProcessInfo()', function () {
    helpers.assertProcessInfo(
      handler.getProcessInfo()
    );
  });

  it('.getOsInfo()', function () {
    helpers.assertOsInfo(
      handler.getOsInfo()
    );
  });

  it('.getTrace()', function () {
    helpers.assertTrace(
      handler.getTrace(new Error())
    );
  });
});
