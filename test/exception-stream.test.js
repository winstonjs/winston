/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const { Writable } = require('readable-stream');
const path = require('path');
const winston = require('../lib/winston');
const ExceptionStream = require('../lib/winston/exception-stream');

describe('ExceptionStream', function () {
  it('has expected methods', function () {
    var filename = path.join(__dirname, 'fixtures', 'logs', 'exception-stream.log');
    var transport = new winston.transports.File({ filename });
    var instance = new ExceptionStream(transport);

    assume(instance.handleExceptions).is.true();
    assume(instance.transport).equals(transport);
    assume(instance._write).is.a('function');
    assume(instance).instanceof(ExceptionStream);
    assume(instance).inherits(Writable);
  });

  it('throws without a transport', function () {
    assume(function () {
      var stream = new ExceptionStream();
      stream._write({ exception: true });
    }).throws('ExceptionStream requires a TransportStream instance.');
  })
});
