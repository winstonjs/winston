'use strict';

/*
 * logger.test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

const assume = require('assume');
const helpers = require('./helpers');
const isStream = require('is-stream');
const { MESSAGE } = require('triple-beam');
const path = require('path');
const stdMocks = require('std-mocks');
const TransportStream = require('winston-transport');
const winston = require('../lib/winston');

describe('Logger', () => {
  it('new Logger()', () => {
    const logger = winston.createLogger();
    assume(logger).is.an('object');
    assume(isStream(logger.format));
    assume(logger.level).equals('info');
    assume(logger.exitOnError).equals(true);
  });

  it('new Logger({ parameters })', () => {
    const myFormat = winston.format(info => info)();
    const logger = winston.createLogger({
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

  it('.add({ invalid Transport })', () => {
    const logger = winston.createLogger();
    assume(() => {
      logger.add(5);
    }).throws(/invalid transport/i);
  });

  it('.add(TransportStream)', done => {
    const logger = winston.createLogger();
    const expected = { message: 'foo', level: 'info' };
    const transport = new TransportStream({
      log(info) {
        assume(info.message).equals('foo');
        assume(info.level).equals('info');
        assume(info[MESSAGE]).equals(JSON.stringify({ message: 'foo', level: 'info' }));
        done();
      }
    });

    logger.add(transport);
    logger.log(expected);
  });

  it('.stream()', () => {
    const logger = winston.createLogger();
    const outStream = logger.stream();

    assume(isStream(outStream)).true();
  });

  it('.configure()', () => {
    const logger = winston.createLogger({
      transports: [new winston.transports.Console()]
    });

    assume(logger.transports.length).equals(1);
    assume(logger.transports[0].name).equals('console');

    logger.configure();

    assume(logger.transports.length).equals(0);
  });

  it('.configure({ transports })', () => {
    const logger = winston.createLogger();

    assume(logger.transports.length).equals(0);

    logger.configure({
      transports: [new winston.transports.Console()]
    });

    assume(logger.transports.length).equals(1);
    assume(logger.transports[0].name).equals('console');
  });

  it('.configure({ transports, format })', () => {
    const logger = winston.createLogger();
    const { format } = logger;

    assume(logger.transports.length).equals(0);

    logger.configure({
      transports: [new winston.transports.Console()],
      format: winston.format.json()
    });

    assume(logger.transports.length).equals(1);
    assume(logger.transports[0].name).equals('console');
    assume(logger.format).not.equals(format);
  });

  it('.remove() [transport not added]', () => {
    const transports = [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log')
      })
    ];

    const logger = winston.createLogger({ transports })
      .remove(new winston.transports.Console());

    assume(logger.transports.length).equals(2);
    // Unwrap LegacyTransportStream instances
    assume(logger.transports.map(wrap => wrap.transport || wrap))
      .deep.equals(transports);
  });

  it('.remove() [TransportStream]', () => {
    const transports = [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log')
      })
    ];

    const logger = winston.createLogger({ transports });

    assume(logger.transports.length).equals(2);
    logger.remove(transports[0]);
    assume(logger.transports.length).equals(1);
    assume(logger.transports[0]).equals(transports[1]);
  });

  it('.clear() [no transports]', () => {
    const logger = winston.createLogger();
    assume(logger.transports.length).equals(0);
    logger.clear();
    assume(logger.transports.length).equals(0);
  });

  it('.clear() [transports]', () => {
    const logger = winston.createLogger({
      transports: [new winston.transports.Console()]
    });

    assume(logger.transports.length).equals(1);
    logger.clear();
    assume(logger.transports.length).equals(0);
  });

  it('{ silent: true }', done => {
    const neverLogTo = new TransportStream({
      log() {
        assume(false).true('TransportStream was improperly written to');
      }
    });

    const logger = winston.createLogger({
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

describe('Logger (multiple transports of the same type)', () => {
  let logger;
  let transports;

  before(() => {
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

    logger = winston.createLogger({ transports  });
  });

  it('should have both transports', () => {
    assume(logger.transports.length).equals(2);
    assume(logger.transports.map(wrap => wrap.transport || wrap))
      .deep.equals(transports);
  });

  it('.remove() of one transport', () => {
    logger.remove(transports[0]);
    assume(logger.transports.length).equals(1);
    assume(logger.transports[0]).equals(transports[1]);
  });
});

describe('Logger (levels)', () => {
  it('report unknown levels', done => {
    stdMocks.use();
    const logger = helpers.createLogger(() => {});
    const expected = { message: 'foo', level: 'bar' };
    logger.log(expected);

    stdMocks.restore();
    const output = stdMocks.flush();

    assume(output.stderr).deep.equals(['[winston] Unknown logger level: bar\n']);
    done();
  });

  it('default levels', done => {
    const logger = winston.createLogger();
    const expected = { message: 'foo', level: 'info' };

    function logLevelTransport(level) {
      return new TransportStream({
        level,
        log(obj) {
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
      .add(logLevelTransport('error'))
      .add(logLevelTransport('info'))
      .log(expected);
  });

  it('custom levels', done => {
    const logger = winston.createLogger({
      levels: {
        bad: 0,
        test: 1,
        ok: 2
      }
    });

    const expected = { message: 'foo', level: 'test' };
    function filterLevelTransport(level) {
      return new TransportStream({
        level,
        log(obj) {
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

describe('Logger (logging exotic data types)', () => {
  describe('.log', () => {
    it(`.log(new Error()) uses Error instance as info`, done => {
      const err = new Error('test');
      err.level = 'info';

      const logger = helpers.createLogger(info => {
        assume(info).instanceOf(Error);
        assume(info).equals(err);
        done();
      });

      logger.log(err);
    });
  });

  describe('.info', () => {
    it('.info(undefined) creates info with { message: undefined }', done => {
      const logger = helpers.createLogger(info => {
        // eslint-disable-next-line no-undefined
        assume(info.message).equals(undefined);
        done();
      });

      logger.info(undefined); // eslint-disable-line no-undefined
    });

    it('.info(null) creates info with { message: null }', done => {
      const logger = helpers.createLogger(info => {
        assume(info.message).equals(null);
        done();
      });

      logger.info(null);
    });

    it('.info(new Error()) uses Error instance as info', done => {
      const err = new Error('test');
      const logger = helpers.createLogger(info => {
        assume(info).instanceOf(Error);
        assume(info).equals(err);
        done();
      });

      logger.info(err);
    });

    it.skip(`.info('any string', new Error())`, done => {
      const err = new Error('test');
      // eslint-disable-next-line no-unused-vars
      const logger = helpers.createLogger(info => {
        // TODO (indexzero): assert this works.
        done();
      });

      logger.info(err);
    });
  });
});

describe('Logger (profile, startTimer)', () => {
  it('profile(id, info)', done => {
    const logger = helpers.createLogger(info => {
      assume(info).is.an('object');
      assume(info.something).equals('ok');
      assume(info.level).equals('info');
      assume(info.durationMs).is.a('number');
      assume(info.message).equals('testing1');
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    logger.profile('testing1');
    setTimeout(() => {
      logger.profile('testing1', {
        something: 'ok',
        level: 'info'
      });
    }, 100);
  });

  it('profile(id, callback) ignores callback', done => {
    const logger = helpers.createLogger(info => {
      assume(info).is.an('object');
      assume(info.something).equals('ok');
      assume(info.level).equals('info');
      assume(info.durationMs).is.a('number');
      assume(info.message).equals('testing2');
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    logger.profile('testing2', () => {
      done(new Error('Unexpected callback invoked'));
    });

    setTimeout(() => {
      logger.profile('testing2', {
        something: 'ok',
        level: 'info'
      });
    }, 100);
  });

  it('startTimer()', done => {
    const logger = helpers.createLogger(info => {
      assume(info).is.an('object');
      assume(info.something).equals('ok');
      assume(info.level).equals('info');
      assume(info.durationMs).is.a('number');
      assume(info.message).equals('testing1');
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    const timer = logger.startTimer();
    setTimeout(() => {
      timer.done({
        message: 'testing1',
        something: 'ok',
        level: 'info'
      });
    }, 100);
  });
});
