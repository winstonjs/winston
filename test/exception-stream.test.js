/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assume = require('assume'),
    stream = require('stream'),
    path = require('path'),
    winston = require('../lib/winston'),
    ExceptionStream = require('../lib/winston/exception-stream'),
    helpers = require('./helpers');

describe('ExceptionStream', function () {
  it('has expected methods', function () {
    var filename = path.join(__dirname, 'fixtures', 'logs', 'exception-stream.log');
    var transport = new winston.transports.File({ filename });
    var instance = new ExceptionStream(transport);

    assume(instance.handleExceptions).is.true();
    assume(instance.transport).equals(transport);
    assume(instance._write).is.a('function');
    assume(instance).instanceof(ExceptionStream);
    assume(instance).inherits(stream.Writable);
  });

  it('throws without a transport', function () {
    assume(function () {
      var stream = new ExceptionStream();
      stream._write({ exception: true });
    }).throws('ExceptionStream requires a TransportStream instance.');
  })
});
