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
const stream = require('readable-stream');
const util = require('util');
const { EOL } = require('os');
const isStream = require('is-stream');
const stdMocks = require('std-mocks');
const { MESSAGE, SPLAT } = require('triple-beam');
const winston = require('../lib/winston');
const TransportStream = require('winston-transport');
const format = require('../lib/winston').format;
const helpers = require('./helpers');
const mockTransport = require('./helpers/mocks/mock-transport');

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

  it('new Logger({ levels }) defines custom methods', function () {
    var myFormat = format(function (info, opts) {
      return info;
    })();

    var logger = winston.createLogger({
      levels: winston.config.syslog.levels,
      format: myFormat,
      level: 'error',
      exitOnError: false,
      transports: []
    });

    Object.keys(winston.config.syslog.levels).forEach(level => {
      assume(logger[level]).is.a('function');
    })
  });

  it('new Logger({ levels }) custom methods are not bound to instance', function (done) {
    var logger = winston.createLogger({
      level: 'error',
      exitOnError: false,
      transports: []
    });

    let logs = [];
    let extendedLogger = Object.create(logger, {
      write: {
        value: function(...args) {
          logs.push(args);
          if (logs.length === 4) {
            assume(logs.length).is.eql(4);
            assume(logs[0]).is.eql([{ test: 1, level: 'info' }]);
            assume(logs[1]).is.eql([{ test: 2, level: 'warn' }]);
            assume(logs[2]).is.eql([{ message: 'test3', level: 'info' }])
            assume(logs[3]).is.eql([{ with: 'meta',
              test: 4,
              level: 'warn',
              message: 'a warning'
            }]);

            done();
          }
        }
      }
    });

    extendedLogger.log('info', { test: 1 });
    extendedLogger.log('warn', { test: 2 });
    extendedLogger.info('test3');
    extendedLogger.warn('a warning', { with: 'meta', test: 4 });
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

  it('.stream()', function () {
    var logger = winston.createLogger();
    var outStream = logger.stream();

    assume(isStream(outStream)).true();
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

  it('{ silent: true }', function (done) {
    const neverLogTo = new TransportStream({
      log: function (info) {
        assume(false).true('TransportStream was improperly written to');
      }
    });

    var logger = winston.createLogger({
      transports: [neverLogTo],
      silent: true
    });

    logger.log({
      level: 'info',
      message: 'This should be ignored'
    });

    setImmediate(() => done());
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

  it('.<level>()', function (done) {
    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).is.a('string');
      assume(info[MESSAGE]).is.a('string');
      assume(info.message).equals('');
      assume(info[MESSAGE]).equals(JSON.stringify({
        level: 'info',
        message: ''
      }));

      done();
    });

    logger.info();
    logger.info('');
  });

  it('default levels', function (done) {
    var logger = winston.createLogger();
    var expected = { message: 'foo', level: 'debug' };

    function logLevelTransport(level) {
      return new TransportStream({
        level: level,
        log: function (obj) {
          if (level === 'info') {
            assume(obj).equals(undefined, 'Transport on level info should never be called');
          }

          assume(obj.message).equals('foo');
          assume(obj.level).equals('debug');
          assume(obj[MESSAGE]).equals(JSON.stringify({ message: 'foo', level: 'debug' }));
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

  it('sets transports levels', done => {
    let logger;
    const transport = new TransportStream({
      log(obj) {
        if (obj.level === 'info') {
          assume(obj).equals(undefined, 'Transport on level info should never be called');
        }

        assume(obj.message).equals('foo');
        assume(obj.level).equals('error');
        assume(obj[MESSAGE]).equals(JSON.stringify({ message: 'foo', level: 'error' }));
        done();
      }
    });

    // Begin our test in the next tick after the pipe event is
    // emitted from the transport.
    transport.once('pipe', () => setImmediate(() => {
      const expectedError = { message: 'foo', level: 'error' };
      const expectedInfo = { message: 'bar', level: 'info' };

      assume(logger.error).is.a('function');
      assume(logger.info).is.a('function');

      // Set the level
      logger.level = 'error';

      // Log the messages. "info" should never arrive.
      logger
        .log(expectedInfo)
        .log(expectedError);
    }));

    logger = winston.createLogger({
      transports: [transport]
    });
  });
});

describe('Logger (level enabled/disabled)', function () {
  it('default levels', function () {
    var logger = winston.createLogger({
      level: 'verbose',
      levels: winston.config.npm.levels,
      transports: [new winston.transports.Console()]
    });

    assume(logger.isLevelEnabled).is.a('function');

    assume(logger.isErrorEnabled).is.a('function');
    assume(logger.isWarnEnabled).is.a('function');
    assume(logger.isInfoEnabled).is.a('function');
    assume(logger.isVerboseEnabled).is.a('function');
    assume(logger.isDebugEnabled).is.a('function');
    assume(logger.isSillyEnabled).is.a('function');

    assume(logger.isLevelEnabled('error')).true();
    assume(logger.isLevelEnabled('warn')).true();
    assume(logger.isLevelEnabled('info')).true();
    assume(logger.isLevelEnabled('verbose')).true();
    assume(logger.isLevelEnabled('debug')).false();
    assume(logger.isLevelEnabled('silly')).false();

    assume(logger.isErrorEnabled()).true();
    assume(logger.isWarnEnabled()).true();
    assume(logger.isInfoEnabled()).true();
    assume(logger.isVerboseEnabled()).true();
    assume(logger.isDebugEnabled()).false();
    assume(logger.isSillyEnabled()).false();
  });

  it('default levels, transport override', function () {
    var transport = new winston.transports.Console();
    transport.level = 'debug';

    var logger = winston.createLogger({
      level: 'info',
      levels: winston.config.npm.levels,
      transports: [transport]
    });

    assume(logger.isLevelEnabled).is.a('function');

    assume(logger.isErrorEnabled).is.a('function');
    assume(logger.isWarnEnabled).is.a('function');
    assume(logger.isInfoEnabled).is.a('function');
    assume(logger.isVerboseEnabled).is.a('function');
    assume(logger.isDebugEnabled).is.a('function');
    assume(logger.isSillyEnabled).is.a('function');

    assume(logger.isLevelEnabled('error')).true();
    assume(logger.isLevelEnabled('warn')).true();
    assume(logger.isLevelEnabled('info')).true();
    assume(logger.isLevelEnabled('verbose')).true();
    assume(logger.isLevelEnabled('debug')).true();
    assume(logger.isLevelEnabled('silly')).false();

    assume(logger.isErrorEnabled()).true();
    assume(logger.isWarnEnabled()).true();
    assume(logger.isInfoEnabled()).true();
    assume(logger.isVerboseEnabled()).true();
    assume(logger.isDebugEnabled()).true();
    assume(logger.isSillyEnabled()).false();
  });

  it('default levels, no transports', function () {
    var logger = winston.createLogger({
      level: 'verbose',
      levels: winston.config.npm.levels,
      transports: []
    });

    assume(logger.isLevelEnabled).is.a('function');

    assume(logger.isErrorEnabled).is.a('function');
    assume(logger.isWarnEnabled).is.a('function');
    assume(logger.isInfoEnabled).is.a('function');
    assume(logger.isVerboseEnabled).is.a('function');
    assume(logger.isDebugEnabled).is.a('function');
    assume(logger.isSillyEnabled).is.a('function');

    assume(logger.isLevelEnabled('error')).true();
    assume(logger.isLevelEnabled('warn')).true();
    assume(logger.isLevelEnabled('info')).true();
    assume(logger.isLevelEnabled('verbose')).true();
    assume(logger.isLevelEnabled('debug')).false();
    assume(logger.isLevelEnabled('silly')).false();

    assume(logger.isErrorEnabled()).true();
    assume(logger.isWarnEnabled()).true();
    assume(logger.isInfoEnabled()).true();
    assume(logger.isVerboseEnabled()).true();
    assume(logger.isDebugEnabled()).false();
    assume(logger.isSillyEnabled()).false();
  });

  it('custom levels', function () {
    var logger = winston.createLogger({
      level: 'test',
      levels: {
        bad: 0,
        test: 1,
        ok: 2
      },
      transports: [new winston.transports.Console()]
    });

    assume(logger.isLevelEnabled).is.a('function');

    assume(logger.isBadEnabled).is.a('function');
    assume(logger.isTestEnabled).is.a('function');
    assume(logger.isOkEnabled).is.a('function');

    assume(logger.isLevelEnabled('bad')).true();
    assume(logger.isLevelEnabled('test')).true();
    assume(logger.isLevelEnabled('ok')).false();

    assume(logger.isBadEnabled()).true();
    assume(logger.isTestEnabled()).true();
    assume(logger.isOkEnabled()).false();
  });

  it('custom levels, no transports', function () {
    var logger = winston.createLogger({
      level: 'test',
      levels: {
        bad: 0,
        test: 1,
        ok: 2
      },
      transports: []
    });

    assume(logger.isLevelEnabled).is.a('function');

    assume(logger.isBadEnabled).is.a('function');
    assume(logger.isTestEnabled).is.a('function');
    assume(logger.isOkEnabled).is.a('function');

    assume(logger.isLevelEnabled('bad')).true();
    assume(logger.isLevelEnabled('test')).true();
    assume(logger.isLevelEnabled('ok')).false();

    assume(logger.isBadEnabled()).true();
    assume(logger.isTestEnabled()).true();
    assume(logger.isOkEnabled()).false();
  });

  it('custom levels, transport override', function () {
    var transport = new winston.transports.Console();
    transport.level = 'ok';

    var logger = winston.createLogger({
      level: 'bad',
      levels: {
        bad: 0,
        test: 1,
        ok: 2
      },
      transports: [transport]
    });

    assume(logger.isLevelEnabled).is.a('function');

    assume(logger.isBadEnabled).is.a('function');
    assume(logger.isTestEnabled).is.a('function');
    assume(logger.isOkEnabled).is.a('function');

    assume(logger.isLevelEnabled('bad')).true();
    assume(logger.isLevelEnabled('test')).true();
    assume(logger.isLevelEnabled('ok')).true();

    assume(logger.isBadEnabled()).true();
    assume(logger.isTestEnabled()).true();
    assume(logger.isOkEnabled()).true();
  });
});

describe('Logger (stream semantics)', function () {
  it(`'finish' event awaits transports to emit 'finish'`, function (done) {
    const transports = [
      new TransportStream({ log: function () {} }),
      new TransportStream({ log: function () {} }),
      new TransportStream({ log: function () {} })
    ];

    const finished = [];
    const logger = winston.createLogger({ transports });

    // Assert each transport emits finish
    transports.forEach((transport, i) => {
      transport.on('finish', () => finished[i] = true);
    });

    // Manually end the last transport to simulate mixed
    // finished state
    transports[2].end();

    // Assert that all transport 'finish' events have been
    // emitted when the logger emits 'finish'.
    logger.on('finish', function () {
      assume(finished[0]).true();
      assume(finished[1]).true();
      assume(finished[2]).true();
      done();
    });

    setImmediate(() => logger.end());
  });

  it(`rethrows errors from user-defined formats`, function () {
    stdMocks.use();
    const logger = winston.createLogger( {
      transports: [new winston.transports.Console()],
      format: winston.format.printf((info) => {
        // Set a trap.
        if (info.message === 'ENDOR') {
          throw new Error('ITS A TRAP!');
        }

        return info.message;
      })
    });

    // Trigger the trap.  Swallow the error so processing continues.
    try {
      logger.info('ENDOR');
    } catch (err) {
      assume(err.message).equals('ITS A TRAP!');
    }

    const expected = [
      'Now witness the power of the fully armed and operational logger',
      'Consider the philosophical and metaphysical – BANANA BANANA BANANA',
      'I was god once. I saw – you were doing well until everyone died.'
    ];

    expected.forEach(msg => logger.info(msg));

    stdMocks.restore();
    const actual = stdMocks.flush();
    assume(actual.stdout).deep.equals(expected.map(msg => `${msg}${EOL}`));
    assume(actual.stderr).deep.equals([]);
  });
});

describe('Logger (winston@2 logging API)', function () {
  it('.log(level, message)', function (done) {
    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('Some super awesome log message');
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    logger.log('info', 'Some super awesome log message')
  });

  it(`.log(level, undefined) creates info with { message: undefined }`, function (done) {
    const logger = helpers.createLogger(function (info) {
      assume(info.message).equals(undefined);
      done();
    });

    logger.log('info', undefined);
  });

  it(`.log(level, null) creates info with { message: null }`, function (done) {
    const logger = helpers.createLogger(function (info) {
      assume(info.message).equals(null);
      done();
    });

    logger.log('info', null);
  });

  it(`.log(level, new Error()) uses Error instance as info`, function (done) {
    const err = new Error('test');
    const logger = helpers.createLogger(function (info) {
      assume(info).instanceOf(Error);
      assume(info).equals(err);
      done();
    });

    logger.log('info', err);
  });

  it('.log(level, message, meta)', function (done) {
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

  it('.log(level, formatStr, ...splat)', function (done) {
    const format = winston.format.combine(
      winston.format.splat(),
      winston.format.printf(info => `${info.level}: ${info.message}`)
    );

    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('100% such wow {"much":"javascript"}');
      assume(info[SPLAT]).deep.equals([100, 'wow', { much: 'javascript' }]);
      assume(info[MESSAGE]).equals('info: 100% such wow {"much":"javascript"}');
      done();
    }, format);

    logger.log('info', '%d%% such %s %j', 100, 'wow', { much: 'javascript' });
  });

  it('.log(level, formatStr, ...splat, meta)', function (done) {
    const format = winston.format.combine(
      winston.format.splat(),
      winston.format.printf(info => `${info.level}: ${info.message} ${JSON.stringify({ thisIsMeta: info.thisIsMeta })}`)
    );

    var logger = helpers.createLogger(function (info) {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('100% such wow {"much":"javascript"}');
      assume(info[SPLAT]).deep.equals([100, 'wow', { much: 'javascript' }]);
      assume(info.thisIsMeta).true();
      assume(info[MESSAGE]).equals('info: 100% such wow {"much":"javascript"} {"thisIsMeta":true}');
      done();
    }, format);

    logger.log('info', '%d%% such %s %j', 100, 'wow', { much: 'javascript' }, { thisIsMeta: true });
  });
});

describe('Logger (logging exotic data types)', function () {
  describe('.log', function () {
    it(`.log(new Error()) uses Error instance as info`, function (done) {
      const err = new Error('test');
      err.level = 'info';

      const logger = helpers.createLogger(function (info) {
        assume(info).instanceOf(Error);
        assume(info).equals(err);
        done();
      });

      logger.log(err);
    });

    it(`.info('Hello') preserve meta without splat format`, function (done) {
      const logged = [];
      const logger = helpers.createLogger(function (info, enc, next) {
        logged.push(info);
        assume(info.label).equals('world');
        next();

        if (logged.length === 1) done();
      });

      logger.info('Hello', { label: 'world' });
    });

    it(`.info('Hello %d') does not mutate unnecessarily with string interpolation tokens`, function (done) {
      const logged = [];
      const logger = helpers.createLogger(function (info, enc, next) {
        logged.push(info);
        assume(info.label).equals(undefined);
        next();

        if (logged.length === 1) done();
      });

      logger.info('Hello %j', { label: 'world' }, { extra: true });
    });

    it(`.info('Hello') and .info('Hello %d') preserve meta with splat format`, function (done) {
      const logged = [];
      const logger = helpers.createLogger(function (info, enc, next) {
        logged.push(info);
        assume(info.label).equals('world');
        next();

        if (logged.length === 2) done();
      }, format.splat());

      logger.info('Hello', { label: 'world' });
      logger.info('Hello %d', 100, { label: 'world' });
    });
  });

  describe('.info', function () {
    it('.info(undefined) creates info with { message: undefined }', function (done) {
      const logger = helpers.createLogger(function (info) {
        assume(info.message).equals(undefined);
        done();
      });

      logger.info(undefined);
    });

    it('.info(null) creates info with { message: null }', function (done) {
      const logger = helpers.createLogger(function (info) {
        assume(info.message).equals(null);
        done();
      });

      logger.info(null);
    });

    it('.info(new Error()) uses Error instance as info', function (done) {
      const err = new Error('test');
      const logger = helpers.createLogger(function (info) {
        assume(info).instanceOf(Error);
        assume(info).equals(err);
        done();
      });

      logger.info(err);
    });

    it.skip(`.info('any string', new Error())`, function (done) {
      const err = new Error('test');
      const logger = helpers.createLogger(function (info) {
        // TODO (indexzero): assert this works.
        done();
      });

      logger.info(err);
    });
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

describe('Should bubble transport events', () => {
  it('error', (done) => {
    const consoleTransport = new winston.transports.Console();
    const logger = winston.createLogger({
      transports: [consoleTransport]
    });

    logger.on('error', (err, transport) => {
      assume(err).instanceOf(Error);
      assume(transport).is.an('object');
      done();
    });
    consoleTransport.emit('error', new Error());
  });

  it('warn', (done) => {
    const consoleTransport = new winston.transports.Console();
    const logger = winston.createLogger({
      transports: [consoleTransport]
    });

    logger.on('warn', (err, transport) => {
      assume(err).instanceOf(Error);
      assume(transport).is.an('object');
      done();
    });
    consoleTransport.emit('warn', new Error());
  });
});

describe('Should support child loggers & defaultMeta', () => {
  it('sets child meta for text messages correctly', (done) => {
    const assertFn = ((msg) => {
      assume(msg.level).equals('info');
      assume(msg.message).equals('dummy message');
      assume(msg.requestId).equals('451');
      done();
    });

    const logger = winston.createLogger({
      transports: [
        mockTransport.createMockTransport(assertFn)
      ]
    });

    const childLogger = logger.child({ requestId: '451' });
    childLogger.info('dummy message');
  });

  it('sets child meta for json messages correctly', (done) => {
    const assertFn = ((msg) => {
      assume(msg.level).equals('info');
      assume(msg.message.text).equals('dummy');
      assume(msg.requestId).equals('451');
      done();
    });

    const logger = winston.createLogger({
      transports: [
        mockTransport.createMockTransport(assertFn)
      ]
    });

    const childLogger = logger.child({ requestId: '451' });
    childLogger.info({ text: 'dummy' });
  });

  it('merges child and provided meta correctly', (done) => {
    const assertFn = ((msg) => {
      assume(msg.level).equals('info');
      assume(msg.message).equals('dummy message');
      assume(msg.service).equals('user-service');
      assume(msg.requestId).equals('451');
      done();
    });

    const logger = winston.createLogger({
      transports: [
        mockTransport.createMockTransport(assertFn)
      ]
    });

    const childLogger = logger.child({ service: 'user-service' });
    childLogger.info('dummy message', { requestId: '451' });
  });

  it('provided meta take precedence over defaultMeta', (done) => {
    const assertFn = ((msg) => {
      assume(msg.level).equals('info');
      assume(msg.message).equals('dummy message');
      assume(msg.service).equals('audit-service');
      assume(msg.requestId).equals('451');
      done();
    });

    const logger = winston.createLogger({
      defaultMeta: { service: 'user-service' },
      transports: [
        mockTransport.createMockTransport(assertFn)
      ]
    });

    logger.info('dummy message', {
      requestId: '451',
      service: 'audit-service'
    });
  });

  it('provided meta take precedence over child meta', (done) => {
    const assertFn = ((msg) => {
      assume(msg.level).equals('info');
      assume(msg.message).equals('dummy message');
      assume(msg.service).equals('audit-service');
      assume(msg.requestId).equals('451');
      done();
    });

    const logger = winston.createLogger({
      transports: [
        mockTransport.createMockTransport(assertFn)
      ]
    });

    const childLogger = logger.child({ service: 'user-service' });
    childLogger.info('dummy message', {
      requestId: '451',
      service: 'audit-service'
    });
  });

  it('handles error stack traces in child loggers correctly', (done) => {
    const assertFn = ((msg) => {
      assume(msg.level).equals('error');
      assume(msg.message).equals('dummy error');
      assume(msg.stack).includes('logger.test.js');
      assume(msg.service).equals('user-service');
      done();
    });

    const logger = winston.createLogger({
      transports: [
        mockTransport.createMockTransport(assertFn)
      ]
    });

    const childLogger = logger.child({ service: 'user-service' });
    childLogger.error(Error('dummy error'));
  });

  it('defaultMeta() autobinds correctly', (done) => {
    const logger = helpers.createLogger(info => {
      assume(info.message).equals('test');
      done();
    });

    const log = logger.info;
    log('test');
  });
});
