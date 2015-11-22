/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var winston = require('../lib/winston'),
    helpers = require('./helpers');

describe('winston/exception-handler', function () {
  var handler = new winston.ExceptionHandler();

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
