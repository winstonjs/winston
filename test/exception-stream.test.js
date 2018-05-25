'use strict';

/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const ExceptionStream = require('../lib/winston/exception-stream');
const path = require('path');
const stream = require('stream');
const winston = require('../lib/winston');

describe('ExceptionStream', () => {
  it('has expected methods', () => {
    const filename = path.join(__dirname, 'fixtures', 'logs', 'exception-stream.log');
    const transport = new winston.transports.File({ filename });
    const instance = new ExceptionStream(transport);

    assume(instance.handleExceptions).is.true();
    assume(instance.transport).equals(transport);
    assume(instance._write).is.a('function');
    assume(instance).instanceof(ExceptionStream);
    assume(instance).inherits(stream.Writable);
  });

  it('throws without a transport', () => {
    assume(() => {
      const exceptionStream = new ExceptionStream();
      exceptionStream._write({ exception: true });
    }).throws('ExceptionStream requires a TransportStream instance.');
  });
});
