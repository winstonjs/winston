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

async function writeToStreamAsync(stream, payload) {
  return new Promise((resolve, reject) => {
    stream._write(payload, 'utf8', (err) => {
      return err ? reject(err) : resolve();
    });
  });
}

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
    const invalidInstantation = () => new ExceptionStream();

    assume(invalidInstantation).throws('ExceptionStream requires a TransportStream instance.');
  });

  describe('_write method', function () {
    let exceptionStream;
    let fakeTransport;
    let transportLogCalls;
    beforeEach(function () {
      transportLogCalls = [];
      fakeTransport = {
        log: (info, callback) => {
          transportLogCalls.push(info);
          return setImmediate(callback);
        }
      };
      exceptionStream = new ExceptionStream(fakeTransport);
    });

    it('should write to the transport when the exception property is false', async function () {
      const info = {
        level: 'error',
        message: 'Test exception message',
        exception: true,
        timestamp: new Date().toISOString()
      };

      await writeToStreamAsync(exceptionStream, info);

      assume(transportLogCalls).to.be.length(1);
    });

    // eslint-disable-next-line no-undefined
    const falsyValues = [false, null, undefined, 0, '', NaN];
    it.each(falsyValues)(
      'should not write to transport when the exception property is a falsy value of: "%s"',
      async function (falsyValue) {
        const info = {
          level: 'error',
          exception: falsyValue,
          message: 'Regular log message',
          timestamp: new Date().toISOString()
        };

        await writeToStreamAsync(exceptionStream, info);

        assume(transportLogCalls).to.be.length(0);
      }
    );
  });
});
