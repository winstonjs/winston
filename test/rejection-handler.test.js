/*
 * rejection-test.js: Tests for rejection data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const stream = require('stream');
const assume = require('assume');
const mocha = require('mocha');
const winston = require('../lib/winston');
const helpers = require('./helpers');

//
// This is an awful and fragile hack that
// needs to be changed ASAP.
// https://github.com/mochajs/mocha/issues/1985
//
var _runTest = mocha.Runner.prototype.runTest;
mocha.Runner.prototype.runTest = function () {
  this.allowUncaught = true;
  _runTest.apply(this, arguments);
};

describe('UnhandledRejectionHandler', function () {
  this.timeout(5000);

  it('has expected methods', function () {
    var handler = helpers.rejectionHandler();
    assume(handler.handle).is.a('function');
    assume(handler.unhandle).is.a('function');
    assume(handler.getAllInfo).is.a('function');
    assume(handler.getProcessInfo).is.a('function');
    assume(handler.getOsInfo).is.a('function');
    assume(handler.getTrace).is.a('function');
  });

  it('new RejectionHandler()', function () {
    assume(function () {
      new winston.RejectionHandler();
    }).throws(/Logger is required/);
  });

  it('new RejectionHandler(logger)', function () {
    var logger = winston.createLogger();
    var handler = new winston.RejectionHandler(logger);
    assume(handler.logger).equals(logger);
  });

  it('.getProcessInfo()', function () {
    var handler = helpers.rejectionHandler();
    helpers.assertProcessInfo(handler.getProcessInfo());
  });

  it('.getOsInfo()', function () {
    var handler = helpers.rejectionHandler();
    helpers.assertOsInfo(handler.getOsInfo());
  });

  it('.getTrace(new Error)', function () {
    var handler = helpers.rejectionHandler();
    helpers.assertTrace(handler.getTrace(new Error()));
  });

  it('.getTrace()', function () {
    var handler = helpers.rejectionHandler();
    helpers.assertTrace(handler.getTrace());
  });

  it('.handle()', function (done) {
    var existing = helpers.clearRejections();
    var writeable = new stream.Writable({
      objectMode: true,
      write: function (info) {
        assume(info).is.an('object');
        assume(info.error).is.an('error');
        assume(info.error.message).equals('wtf this rejection');
        assume(info.message).includes('unhandledRejection: wtf this rejection');
        assume(info.stack).is.a('string');
        assume(info.process).is.an('object');
        assume(info.os).is.an('object');
        assume(info.trace).is.an('array');

        existing.restore();
        done();
      }
    });

    var transport = new winston.transports.Stream({ stream: writeable });
    var handler = helpers.rejectionHandler({
      exitOnError: false,
      transports: [transport]
    });

    assume(handler.catcher).equals(undefined);

    transport.handleRejections = true;
    handler.handle();

    assume(handler.catcher).is.a('function');
    assume(process.listeners('unhandledRejection')).deep.equals([
      handler.catcher
    ]);

    helpers.reject('wtf this rejection').then(done());
  });

  after(function () {
    //
    // Restore normal `runTest` functionality
    // so that we only affect the current suite.
    //
    mocha.Runner.prototype.runTest = _runTest;
  });
});
