/*
 * logger.test.js: Tests for instances of the winston Logger
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
const TransportStream = require('winston-transport');
const format = require('../lib/winston').format;
const helpers = require('./helpers');

describe('Logger', function () {
  it('new Logger()', function () {
    var logger = winston.createLogger();
    assume(logger).is.an('object');
    assume(isStream(logger.format));
    assume(logger.level).equals('info');
    assume(logger.exitOnError).equals(true);
  });

  it('new Logger({ parameters })', function () {
    var myFormat = format(function (info, opts) {
      return info;
    })();

    var logger = winston.createLogger({
      format: myFormat,
      level: 'error',
      exitOnError: false,
      transports: []
    });

    assume(logger.format).equals(myFormat);
    assume(logger.level).equals('error');
    assume(logger.exitOnError).equals(false);
    assume(logger._readableState.pipesCount).equals(0);
  });

  it('.add({ invalid Transport })', function () {
    var logger = winston.createLogger();
    assume(function () {
      logger.add(5);
    }).throws(/invalid transport/i);
  });

  it('.add(TransportStream)', function (done) {
    var logger = winston.createLogger();
    var expected = { message: 'foo', level: 'info' };
    var transport = new TransportStream({
      log: function (info) {
        assume(info.message).equals('foo');
        assume(info.level).equals('info');
        assume(info[MESSAGE]).equals(JSON.stringify({ message: 'foo', level: 'info' }));
        done();
      }
    });

    logger.add(transport);
    logger.log(expected);
  });

  it('.configure()', function () {
    var logger = winston.createLogger({
      transports: [new winston.transports.Console()]
    });

    assume(logger.transports.length).equals(1);
    assume(logger.transports[0].name).equals('console');

    logger.configure();

    assume(logger.transports.length).equals(0);
  });

  it('.configure({ transports })', function () {
    var logger = winston.createLogger();

    assume(logger.transports.length).equals(0);

    logger.configure({
      transports: [new winston.transports.Console()]
    });

    assume(logger.transports.length).equals(1);
    assume(logger.transports[0].name).equals('console');
  });

  it('.configure({ transports, format })', function () {
    var logger = winston.createLogger(),
        format = logger.format;

    assume(logger.transports.length).equals(0);

    logger.configure({
      transports: [new winston.transports.Console()],
      format: winston.format.json()
    });

    assume(logger.transports.length).equals(1);
    assume(logger.transports[0].name).equals('console');
    assume(logger.format).not.equals(format);
  });

  it('.remove() [transport not added]', function () {
    var transports = [
      new winston.transports.Console(),
      new winston.transports.File({ filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log' )})
    ];

    var logger = winston.createLogger({ transports: transports })
      .remove(new winston.transports.Console());

    assume(logger.transports.length).equals(2);
    assume(logger.transports.map(function (wrap) {
      // Unwrap LegacyTransportStream instances
      return wrap.transport || wrap;
    })).deep.equals(transports);
  });

  it('.remove() [TransportStream]', function () {
    var transports = [
      new winston.transports.Console(),
      new winston.transports.File({ filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log' )})
    ];

    var logger = winston.createLogger({ transports: transports });

    assume(logger.transports.length).equals(2);
    logger.remove(transports[0]);
    assume(logger.transports.length).equals(1);
    assume(logger.transports[0]).equals(transports[1]);
  });

  it('.clear() [no transports]', function () {
    var logger = winston.createLogger();
    assume(logger.transports.length).equals(0);
    logger.clear();
    assume(logger.transports.length).equals(0);
  });

  it ('.clear() [transports]', function () {
    var logger = winston.createLogger({
      transports: [new winston.transports.Console()]
    });

    assume(logger.transports.length).equals(1);
    logger.clear();
    assume(logger.transports.length).equals(0);
  });
});

describe('Logger (multiple transports of the same type)', function () {
  var logger, transports;

  before(function () {
    transports = [
      new winston.transports.File({
        name: 'filelog-info.log',
        filename: path.join(__dirname, 'fixtures', 'logs', 'filelog-info.log'),
        level: 'info'
      }),
      new winston.transports.File({
        name: 'filelog-error.log',
        filename: path.join(__dirname, 'fixtures', 'logs', 'filelog-error.log'),
        level: 'error'
      })
    ];

    logger = winston.createLogger({
      transports: transports
    });
  });

  it('should have both transports', function () {
    assume(logger.transports.length).equals(2);
    assume(logger.transports.map(function (wrap) {
      return wrap.transport || wrap;
    })).deep.equals(transports);
  });

  it('.remove() of one transport', function () {
    logger.remove(transports[0]);
    assume(logger.transports.length).equals(1);
    assume(logger.transports[0]).equals(transports[1]);
  });
});

describe('Logger (levels)', function () {
  it('report unknown levels', function (done) {
    stdMocks.use();
    var logger = helpers.createLogger(function (info) {});
    var expected = { message: 'foo', level: 'bar' };
    logger.log(expected);

    stdMocks.restore();
    var output = stdMocks.flush();

    assume(output.stderr).deep.equals(['[winston] Unknown logger level: bar\n']);
    done();
  });

  it('default levels', function (done) {
    var logger = winston.createLogger();
    var expected = { message: 'foo', level: 'info' };

    function logLevelTransport(level) {
      return new TransportStream({
        level: level,
        log: function (obj) {
          if (level === 'debug') {
            assume(obj).equals(undefined, 'Transport on level debug should never be called');
          }

          assume(obj.message).equals('foo');
          assume(obj.level).equals('info');
          assume(obj[MESSAGE]).equals(JSON.stringify({ message: 'foo', level: 'info' }));
          done();
        }
      });
    }

    assume(logger.info).is.a('function');
    assume(logger.debug).is.a('function');

    logger
      .add(logLevelTransport('info'))
      .add(logLevelTransport('debug'))
      .log(expected);
  });

  it('custom levels', function (done) {
    var logger = winston.createLogger({
      levels: {
        bad:  0,
        test: 1,
        ok:   2
      }
    });

    var expected = { message: 'foo', level: 'test' };
    function filterLevelTransport(level) {
      return new TransportStream({
        level: level,
        log: function (obj) {
          if (level === 'bad') {
            assume(obj).equals(undefined, 'transport on level "bad" should never be called');
          }

          assume(obj.message).equals('foo');
          assume(obj.level).equals('test');
          assume(obj[MESSAGE]).equals(JSON.stringify({ message: 'foo', level: 'test' }));
          done();
        }
      });
    }

    assume(logger.bad).is.a('function');
    assume(logger.test).is.a('function');
    assume(logger.ok).is.a('function');

    logger
      .add(filterLevelTransport('bad'))
      .add(filterLevelTransport('ok'))
      .log(expected);
  });
});

describe('Logger (profile, startTimer)', function (done) {
  it('profile(id, info)', function (done) {
    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object'),
      assume(info.something).equals('ok');
      assume(info.level).equals('info');
      assume(info.durationMs).is.a('number');
      assume(info.message).equals('testing1');
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    logger.profile('testing1');
    setTimeout(function () {
      logger.profile('testing1', {
        something: 'ok',
        level: 'info'
      })
    }, 100);
  });

  it('profile(id, callback) ignores callback', function (done) {
    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object'),
      assume(info.something).equals('ok');
      assume(info.level).equals('info');
      assume(info.durationMs).is.a('number');
      assume(info.message).equals('testing2');
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    logger.profile('testing2', function () {
      done(new Error('Unexpected callback invoked'));
    });

    setTimeout(function () {
      logger.profile('testing2', {
        something: 'ok',
        level: 'info'
      })
    }, 100);
  });

  it('startTimer()', function (done) {
    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object'),
      assume(info.something).equals('ok');
      assume(info.level).equals('info');
      assume(info.durationMs).is.a('number');
      assume(info.message).equals('testing1');
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    var timer = logger.startTimer();
    setTimeout(function () {
      timer.done({
        message: 'testing1',
        something: 'ok',
        level: 'info'
      });
    }, 100);
  });
});
