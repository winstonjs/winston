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
const winston = require('../../../lib/winston');
const ExceptionStream = require('../../../lib/winston/exception-stream');
const testLogFixturesPath = path.join(__dirname, '..', '..', 'fixtures', 'logs');

describe('ExceptionStream', function () {
  it('has expected methods', function () {
    var filename = path.join(testLogFixturesPath, 'exception-stream.log');
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
  });

  describe('_write method', function () {
    let transport, exceptionStream;

    beforeEach(function () {
      var filename = path.join(testLogFixturesPath, 'exception-stream-test.log');
      transport = new winston.transports.File({ filename });
      exceptionStream = new ExceptionStream(transport);

      // Mock the transport write method to track calls
      transport._write = function(info, encoding, callback) {
        // Store call info for verification
        transport._write.lastCall = { info, encoding, callback };
        transport._write.callCount = (transport._write.callCount || 0) + 1;
        setImmediate(callback);
      };
      transport._write.callCount = 0;
      transport._write.lastCall = null;
    });

    it.failing('writes info with exception property to transport', function (done) {
      const info = {
        level: 'error',
        message: 'Test exception message',
        exception: true,
        timestamp: new Date().toISOString()
      };

      exceptionStream._write(info, 'utf8', (err) => {
        if (err) return done(err);

        // Verify the transport received the write call
        assume(transport._write.callCount).equals(1);
        assume(transport._write.lastCall.info).equals(info);
        assume(transport._write.lastCall.encoding).equals('utf8');
        done();
      });
    });

    it('skips info without exception property', function (done) {
      const info = {
        level: 'error',
        message: 'Regular log message',
        timestamp: new Date().toISOString()
      };

      exceptionStream._write(info, 'utf8', (err) => {
        if (err) return done(err);

        // Verify the transport was NOT called since info.exception is falsy
        assume(transport._write.callCount).equals(0);
        assume(transport._write.lastCall).equals(null);
        done();
      });
    });

    it.failing('handles transport write errors', function (done) {
      const testError = new Error('Transport write failed');
      transport._write = function(info, encoding, callback) {
        transport._write.callCount = (transport._write.callCount || 0) + 1;
        setImmediate(() => callback(testError));
      };
      transport._write.callCount = 0;

      const info = {
        level: 'error',
        message: 'Test exception message',
        exception: true
      };

      exceptionStream._write(info, 'utf8', (err) => {
        assume(err).equals(testError);
        assume(transport._write.callCount).equals(1);
        done();
      });
    });

    it('calls callback immediately when no exception property', function (done) {
      const info = { level: 'info', message: 'Not an exception' };
      const startTime = Date.now();

      exceptionStream._write(info, 'utf8', (err) => {
        assume(err).equals(undefined);
        // Should complete very quickly since it returns immediately
        assume(Date.now() - startTime).is.below(10);
        done();
      });
    });
  });
});
