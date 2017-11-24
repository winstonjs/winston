/*
 * logger-legacy.test.js: Tests for Legacy APIs of winston < 3.0.0
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

const assume = require('assume');
const path = require('path');
const stream = require('stream');
const util = require('util');
const isStream = require('isstream');
const stdMocks = require('std-mocks');
const { MESSAGE } = require('triple-beam');
const winston = require('../lib/winston');
const LegacyTransport = require('./helpers/mocks/legacy-transport');
const TransportStream = require('winston-transport');
const helpers = require('./helpers');

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
        var logger = winston.createLogger(opts)
      }).throws(/Use a custom/);
    });
  });

  it('.add(LegacyTransport)', function () {
    stdMocks.use();
    var logger = winston.createLogger();
    var transport = new LegacyTransport();
    logger.add(transport);
    stdMocks.restore();
    var output = stdMocks.flush();

    assume(logger._readableState.pipesCount).equals(1);
    assume(logger._readableState.pipes.transport).is.an('object');
    assume(logger._readableState.pipes.transport).equals(transport);
    assume(output.stderr.join('')).to.include('legacy-test is a legacy winston transport. Consider upgrading');
  });

  it('.add(LegacyTransport) multiple', function () {
    stdMocks.use();
    var logger = winston.createLogger({
      transports: [
        new LegacyTransport(),
        new LegacyTransport(),
        new LegacyTransport()
      ]
    });

    stdMocks.restore();
    var output = stdMocks.flush();

    assume(logger._readableState.pipesCount).equals(3);
    var errorMsg = 'legacy-test is a legacy winston transport. Consider upgrading';
    assume(output.stderr.join('')).to.include(errorMsg);
  });

  it('.remove() [LegacyTransportStream]', function () {
    var transports = [
      new winston.transports.Console(),
      new (LegacyTransport)()
    ];

    var logger = winston.createLogger({ transports: transports });

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
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    logger.log('info', 'Some super awesome log message')
  });

  it('log(level, message, meta)', function (done) {
    var meta = { one: 2 };
    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('Some super awesome log message');
      assume(info.one).equals(2);
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    logger.log('info', 'Some super awesome log message', meta);
  });

  it('log(level, formatStr, ...splat)', function (done) {
    const format = winston.format.combine(
      winston.format.splat(),
      winston.format.printf(info => `${info.level}: ${info.message}`)
    );

    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('100% such wow {"much":"javascript"}');
      assume(info.splat).deep.equals([100, 'wow', { much: 'javascript' }]);
      assume(info[MESSAGE]).equals('info: 100% such wow {"much":"javascript"}');
      done();
    }, format);

    logger.log('info', '%d%% such %s %j', 100, 'wow', { much: 'javascript' });
  });

  it('log(level, formatStr, ...splat, meta)', function (done) {
    const format = winston.format.combine(
      winston.format.splat(),
      winston.format.printf(info => `${info.level}: ${info.message} ${JSON.stringify(info.meta)}`)
    );

    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('100% such wow {"much":"javascript"}');
      assume(info.splat).deep.equals([100, 'wow', { much: 'javascript' }]);
      assume(info.meta).deep.equals({ thisIsMeta: true });
      assume(info[MESSAGE]).equals('info: 100% such wow {"much":"javascript"} {"thisIsMeta":true}');
      done();
    }, format);

    logger.log('info', '%d%% such %s %j', 100, 'wow', { much: 'javascript' }, { thisIsMeta: true });
  });

  it('.cli() throws', function () {
    var logger = winston.createLogger();
    assume(logger.cli).throws(/Use a custom/);
  });
});
