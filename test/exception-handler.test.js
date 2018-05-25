'use strict';

/*
 * exception-test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const helpers = require('./helpers');
const mocha = require('mocha');
const stream = require('stream');
const winston = require('../lib/winston');

//
// This is an awful and fragile hack that
// needs to be changed ASAP.
// https://github.com/mochajs/mocha/issues/1985
//
const _runTest = mocha.Runner.prototype.runTest;
mocha.Runner.prototype.runTest = function () {
  this.allowUncaught = true;
  _runTest.apply(this, arguments);
};

describe('ExceptionHandler', function () {
  this.timeout(5000);

  it('has expected methods', () => {
    const handler = helpers.exceptionHandler();
    assume(handler.handle).is.a('function');
    assume(handler.unhandle).is.a('function');
    assume(handler.getAllInfo).is.a('function');
    assume(handler.getProcessInfo).is.a('function');
    assume(handler.getOsInfo).is.a('function');
    assume(handler.getTrace).is.a('function');
  });

  it('new ExceptionHandler()', () => {
    assume(() => new winston.ExceptionHandler())
      .throws(/Logger is required/);
  });

  it('new ExceptionHandler(logger)', () => {
    const logger = winston.createLogger();
    const handler = new winston.ExceptionHandler(logger);
    assume(handler.logger).equals(logger);
  });

  it('.getProcessInfo()', () => {
    const handler = helpers.exceptionHandler();
    helpers.assertProcessInfo(
      handler.getProcessInfo()
    );
  });

  it('.getOsInfo()', () => {
    const handler = helpers.exceptionHandler();
    helpers.assertOsInfo(
      handler.getOsInfo()
    );
  });

  it('.getTrace(new Error)', () => {
    const handler = helpers.exceptionHandler();
    helpers.assertTrace(
      handler.getTrace(new Error())
    );
  });

  it('.getTrace()', () => {
    const handler = helpers.exceptionHandler();
    helpers.assertTrace(
      handler.getTrace()
    );
  });

  it('.handle()', done => {
    const existing = helpers.clearExceptions();
    const writeable = new stream.Writable({
      objectMode: true,
      write(info) {
        assume(info).is.an('object');
        assume(info.error).is.an('error');
        assume(info.error.message).equals('wtf this error');
        assume(info.message).includes('uncaughtException: wtf this error');
        assume(info.stack).is.a('string');
        assume(info.process).is.an('object');
        assume(info.os).is.an('object');
        assume(info.trace).is.an('array');

        existing.restore();
        done();
      }
    });

    const transport = new winston.transports.Stream({ stream: writeable });
    const handler = helpers.exceptionHandler({
      exitOnError: false,
      transports: [transport]
    });

    // eslint-disable-next-line no-undefined
    assume(handler.catcher).equals(undefined);

    transport.handleExceptions = true;
    handler.handle();

    assume(handler.catcher).is.a('function');
    assume(process.listeners('uncaughtException'))
      .deep.equals([handler.catcher]);

    helpers.throw('wtf this error');
  });

  after(() => {
    //
    // Restore normal `runTest` functionality
    // so that we only affect the current suite.
    //
    mocha.Runner.prototype.runTest = _runTest;
  });
});
