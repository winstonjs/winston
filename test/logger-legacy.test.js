/*
 * logger-legacy.test.js: Tests for Legacy APIs of winston < 3.0.0
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

var assume = require('assume'),
    path = require('path'),
    stream = require('stream'),
    util = require('util'),
    isStream = require('isstream'),
    stdMocks = require('std-mocks'),
    winston = require('../lib/winston'),
    LegacyTransport = require('./helpers/mocks/legacy-transport'),
    TransportStream = require('winston-transport'),
    format = require('../lib/winston/formats/format'),
    helpers = require('./helpers');

describe('Logger (legacy API)', function () {
  it('new Logger({ DEPRECATED })', function () {
    var deprecated = [
      { colors: true },
      { emitErrs: true },
      { formatters: [] },
      { padLevels: true },
      { rewriters: [] },
      { stripColors: true }
    ];

    deprecated.forEach(function (opts) {
      assume(function () {
        var logger = new winston.Logger(opts)
      }).throws(/Use a custom/);
    });
  });

  it('.add(LegacyTransport)', function () {
    stdMocks.use();
    var logger = new winston.Logger();
    var transport = new LegacyTransport();
    logger.add(transport);
    stdMocks.restore();
    var output = stdMocks.flush();

    assume(logger._readableState.pipesCount).equals(1);
    assume(logger._readableState.pipes.transport).is.an('object');
    assume(logger._readableState.pipes.transport).equals(transport);
    assume(output.stderr).deep.equals(['legacy-test is a Legacy winston transport. Consider upgrading\n']);
  });

  it('.add(LegacyTransport) multiple', function () {
    stdMocks.use();
    var logger = new winston.Logger({
      transports: [
        new LegacyTransport(),
        new LegacyTransport(),
        new LegacyTransport()
      ]
    });

    stdMocks.restore();
    var output = stdMocks.flush();

    assume(logger._readableState.pipesCount).equals(3);
    var errorMsg = 'legacy-test is a Legacy winston transport. Consider upgrading\n';
    assume(output.stderr).deep.equals([errorMsg, errorMsg, errorMsg]);
  });

  it('.remove() [LegacyTransportStream]', function () {
    var transports = [
      new (winston.transports.Console)(),
      new (LegacyTransport)()
    ];

    var logger = new (winston.Logger)({ transports: transports });

    assume(logger.transports.length).equals(2);
    logger.remove(transports[1]);
    assume(logger.transports.length).equals(1);
    assume(logger.transports[0]).equals(transports[0]);
  });

  it('log(level, message)', function (done) {
    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('Some super awesome log message');
      assume(info.raw).is.a('string');
      done();
    });

    logger.log('info', 'Some super awesome log message')
  });

  it('log(level, message, meta)', function (done) {
    var meta = { one: 2 };
    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object');
      assume(info).equals(meta);
      assume(info.level).equals('info');
      assume(info.message).equals('Some super awesome log message');
      assume(info.one).equals(2);
      assume(info.raw).is.a('string');
      done();
    });

    logger.log('info', 'Some super awesome log message', meta);
  });

  it('.cli() throws', function () {
    var logger = new winston.Logger();

    assume(logger.cli).throws(/Use a custom/);
  });
});
