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
const winston = require('../../../lib/winston');
const TransportStream = require('winston-transport');
const format = require('../../../lib/winston').format;
const helpers = require('../../helpers');
const mockTransports = require('../../helpers/mocks/mock-transport');
const testLogFixturesPath = path.join(__dirname, '..', '..', 'fixtures', 'logs');

describe('Logger Instance', function () {
  let levelOutput = [];
  let logOutput = [];

  beforeEach(() => {
    levelOutput = [];
    logOutput = [];
  });

  describe('Configuration', function () {
    it('.configure()', function () {
      let logger = winston.createLogger({
        transports: [new winston.transports.Console()]
      });

      assume(logger.transports.length).equals(1);
      assume(logger.transports[0].name).equals('console');

      logger.configure();

      assume(logger.transports.length).equals(0);
    });

    it('.configure({ transports })', function () {
      let logger = winston.createLogger();

      assume(logger.transports.length).equals(0);

      logger.configure({
        transports: [new winston.transports.Console()]
      });

      assume(logger.transports.length).equals(1);
      assume(logger.transports[0].name).equals('console');
    });

    it('.configure({ transports, format })', function () {
      let logger = winston.createLogger(),
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
  });

  describe('Transports', function() {
    describe('add', function () {
      it('should throw error when adding an invalid transport', function () {
        let logger = winston.createLogger();
        assume(function () {
          logger.add(5);
        }).throws(/invalid transport/i);
      });

      it('should add the expected transport', function (done) {
        let logger = winston.createLogger();
        let expected = {message: 'foo', level: 'info'};
        let transport = new TransportStream({
          log: function (info) {
            assume(info.message).equals('foo');
            assume(info.level).equals('info');
            assume(JSON.parse(info[MESSAGE])).deep.equals({level: 'info', message: 'foo'});
            done();
          }
        });

        logger.add(transport);
        logger.log(expected);
      });

      it('should allow adding multiple transports', function () {
        let transports = [
          new winston.transports.File({
            name: 'filelog-info.log',
            filename: path.join(testLogFixturesPath, 'filelog-info.log'),
            level: 'info'
          }),
          new winston.transports.File({
            name: 'filelog-error.log',
            filename: path.join(testLogFixturesPath, 'filelog-error.log'),
            level: 'error'
          })
        ];
        let logger = winston.createLogger({
          transports: transports
        });

        assume(logger.transports.length).equals(2);
        assume(logger.transports.map(function (wrap) {
          return wrap.transport || wrap;
        })).deep.equals(transports);
      });
    });

    describe('remove', function () {
      it('should do nothing if transport was not added', function () {
        let transports = [
          new winston.transports.Console(),
          new winston.transports.File({filename: path.join(testLogFixturesPath, 'filelog.log')})
        ];

        let logger = winston.createLogger({transports: transports})
            .remove(new winston.transports.Console());

        assume(logger.transports.length).equals(2);
        assume(logger.transports.map(function (wrap) {
          // Unwrap LegacyTransportStream instances
          return wrap.transport || wrap;
        })).deep.equals(transports);
      });

      it('should remove transport when matching one is found', function () {
        let transports = [
          new winston.transports.Console(),
          new winston.transports.File({filename: path.join(testLogFixturesPath, 'filelog.log')})
        ];

        let logger = winston.createLogger({transports: transports});

        assume(logger.transports.length).equals(2);
        logger.remove(transports[0]);
        assume(logger.transports.length).equals(1);
        assume(logger.transports[0]).equals(transports[1]);
      });

      it('should remove specified logger even when duplicate exists', function () {
        let transports = [
          new winston.transports.File({
            name: 'filelog-info.log',
            filename: path.join(testLogFixturesPath, 'filelog-info.log'),
            level: 'info'
          }),
          new winston.transports.File({
            name: 'filelog-error.log',
            filename: path.join(testLogFixturesPath, 'filelog-error.log'),
            level: 'error'
          })
        ];
        let logger = winston.createLogger({
          transports: transports
        });

        logger.remove(transports[0]);
        assume(logger.transports.length).equals(1);
        assume(logger.transports[0]).equals(transports[1]);
      });
    });

    describe('clear', function () {
      it('should do nothing when no transports exist', function () {
        let logger = winston.createLogger();
        assume(logger.transports.length).equals(0);
        logger.clear();
        assume(logger.transports.length).equals(0);
      });

      it('should remove all transports', function () {
        let logger = winston.createLogger({
          transports: [new winston.transports.Console()]
        });

        assume(logger.transports.length).equals(1);
        logger.clear();
        assume(logger.transports.length).equals(0);
      });
    });

    describe('stream', function () {
      it('should return a log stream for all transports', function () {
        let logger = winston.createLogger();
        let outStream = logger.stream();

        assume(isStream(outStream)).true();
      });
    });

    describe('Multiple Transports', function () {
      it('should log the same thing to every configured transport', function () {
        console.log('Reproduction of Issue #1430');
        this.skip();
        const transport1Output = [];
        const transport2Output = [];
        const customFormat = winston.format.combine(
          winston.format.splat(),
          winston.format.printf((info) => JSON.stringify(info))
        );

        const logger = winston.createLogger();

        logger.add(mockTransports.inMemory(transport1Output, {format: customFormat}));
        logger.add(mockTransports.inMemory(transport2Output, {format: customFormat}));

        for (let index = 0; index < 10; index++) {
          logger.info("test %s" + index, "blub", "metainfo");
        }

        assume(transport1Output).eqls(transport2Output);
      });
    });
  });

  describe('Log Levels', function () {
    it('report unknown levels', function (done) {
      stdMocks.use();
      let logger = helpers.createLogger(function (info) {
      });
      let expected = {message: 'foo', level: 'bar'};
      logger.log(expected);

      stdMocks.restore();
      let output = stdMocks.flush();

      assume(output.stderr).deep.equals(['[winston] Unknown logger level: bar\n']);
      done();
    });

    it('.<level>()', function (done) {
      let logger = helpers.createLogger(function (info) {
        assume(info).is.an('object');
        assume(info.level).equals('info');
        assume(info.message).is.a('string');
        assume(info[MESSAGE]).is.a('string');
        assume(info.message).equals('');
        assume(JSON.parse(info[MESSAGE])).deep.equals({
          level: 'info',
          message: ''
        });

        done();
      });

      logger.info();
      logger.info('');
    });

    it('default levels', function (done) {
      let logger = winston.createLogger();
      let expected = {message: 'foo', level: 'debug'};

      function logLevelTransport(level) {
        return new TransportStream({
          level: level,
          log: function (obj) {
            if (level === 'info') {
              assume(obj).equals(undefined, 'Transport on level info should never be called');
            }

            assume(obj.message).equals('foo');
            assume(obj.level).equals('debug');
            assume(JSON.parse(obj[MESSAGE])).deep.equals({level: 'debug', message: 'foo'});
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
      let logger = winston.createLogger({
        levels: {
          bad: 0,
          test: 1,
          ok: 2
        }
      });

      let expected = {message: 'foo', level: 'test'};

      function filterLevelTransport(level) {
        return new TransportStream({
          level: level,
          log: function (obj) {
            if (level === 'bad') {
              assume(obj).equals(undefined, 'transport on level "bad" should never be called');
            }

            assume(obj.message).equals('foo');
            assume(obj.level).equals('test');
            assume(JSON.parse(obj[MESSAGE])).deep.equals({level: 'test', message: 'foo'});
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
          assume(JSON.parse(obj[MESSAGE])).deep.equals({level: 'error', message: 'foo'});
          done();
        }
      });

      // Begin our test in the next tick after the pipe event is
      // emitted from the transport.
      transport.once('pipe', () => setImmediate(() => {
        const expectedError = {message: 'foo', level: 'error'};
        const expectedInfo = {message: 'bar', level: 'info'};

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

    describe('Log Levels Enabled', function () {
      it('default levels', function () {
        let logger = winston.createLogger({
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
        let transport = new winston.transports.Console();
        transport.level = 'debug';

        let logger = winston.createLogger({
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
        let logger = winston.createLogger({
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
        let logger = winston.createLogger({
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
        let logger = winston.createLogger({
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
        let transport = new winston.transports.Console();
        transport.level = 'ok';

        let logger = winston.createLogger({
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
    })
  });

  describe('Transport Events', function () {
    it(`'finish' event awaits transports to emit 'finish'`, function (done) {
      const transports = [
        new TransportStream({
          log: function () {
          }
        }),
        new TransportStream({
          log: function () {
          }
        }),
        new TransportStream({
          log: function () {
          }
        })
      ];

      const finished = [];
      const logger = winston.createLogger({transports});

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
  })

  describe('Formats', function () {
    it(`rethrows errors from user-defined formats`, function () {
      stdMocks.use();
      const logger = winston.createLogger({
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
  })

  describe('Profiling', function () {
    it('ending profiler with object argument should be included in output', function (done) {
      let logger = helpers.createLogger(function (info) {
        assume(info).is.an('object');
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

    // TODO: Revisit if this is a valid test
    it('calling profile with a callback function should not make a difference', function (done) {
      let logger = helpers.createLogger(function (info) {
        assume(info).is.an('object');
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

    it('should stop a profiler instance generated via `startTimer()` when `done()` is called on it', function (done) {
      const logger = winston.createLogger({
        transports: [mockTransports.inMemory(levelOutput)],
        defaultMeta: {rootLogger: true}
      });

      let timer = logger.startTimer();
      setTimeout(function () {
        timer.done({
          message: 'testing1',
          something: 'ok',
          level: 'info'
        });
        assume(levelOutput).is.length(1);
        assume(levelOutput[0]).contains('durationMs');
        assume(levelOutput[0].durationMs).is.a('number');
        assume(levelOutput[0].message).equals('testing1');
        assume(levelOutput[0].level).equals('info');
        assume(levelOutput[0].something).equals('ok');
        assume(levelOutput[0].rootLogger).is.true();
        done()
      }, 100);
    });
  });

  // TODO: Revisit to improve these
  describe('Logging non-primitive data types', function () {
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

        logger.info('Hello', {label: 'world'});
      });

      it(`.info('Hello %d') does not mutate unnecessarily with string interpolation tokens`, function (done) {
        const logged = [];
        const logger = helpers.createLogger(function (info, enc, next) {
          logged.push(info);
          assume(info.label).equals(undefined);
          next();

          if (logged.length === 1) done();
        });

        logger.info('Hello %j', {label: 'world'}, {extra: true});
      });

      it(`.info('Hello') and .info('Hello %d') preserve meta with splat format`, function (done) {
        const logged = [];
        const logger = helpers.createLogger(function (info, enc, next) {
          logged.push(info);
          assume(info.label).equals('world');
          next();

          if (logged.length === 2) done();
        }, format.splat());

        logger.info('Hello', {label: 'world'});
        logger.info('Hello %d', 100, {label: 'world'});
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

      it(`.info('any string', new Error())`, function () {
        console.log(`The current result of this log statement results in the error message being concatenated with \
the log message provided.\nThis behavior needs to be verified if it's intentional IMO`)
        this.skip();
        const err = new Error('test');
        const logger = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)]
        });

        logger.info('test message!', err);

        assume(levelOutput[0].level).eqls("info");
        assume(levelOutput[0].message).eqls("test message! test");
        assume(levelOutput[0].stack).exists("stack trace must exist");
      });
    });
  });

  describe('Children', () => {
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
          mockTransports.createMockTransport(assertFn)
        ]
      });

      const childLogger = logger.child({service: 'user-service'});
      childLogger.error(Error('dummy error'));
    });

    it('defaultMeta should autobind correctly', (done) => {
      const logger = helpers.createLogger(info => {
        assume(info.message).equals('test');
        done();
      });

      const log = logger.info;
      log('test');
    });
  });

  describe('Metadata with non-primitive data types', function() {
    it('should support a Map', function() {
      const expectedOutput = [
        {level: "info", message: "test message", someMap: new Map([["val1","c"], ["val2", "b"]])}
      ];

      const logger1 = winston.createLogger({
        transports: [mockTransports.inMemory(levelOutput)]
      });
      const logger2 = winston.createLogger({
        transports: [mockTransports.inMemory(logOutput)]
      });
      const logMeta = {
        someMap: new Map([["val1","a"], ["val2", "b"], ["val1","c"]])
      };

      logger1.info("test message", logMeta);
      logger2.info({level: "info", message: "test message", ...logMeta});

      assume(levelOutput).eqls(logOutput);
      assume(expectedOutput).eqls(levelOutput);
      assume(expectedOutput).eqls(logOutput);
    });

    it('should support a Set', function() {
      const expectedOutput = [
        {level: "info", message: "test message", someSet: new Set(["a", "b"])}
      ]

      const logger1 = winston.createLogger({
        transports: [mockTransports.inMemory(levelOutput)]
      });
      const logger2 = winston.createLogger({
        transports: [mockTransports.inMemory(logOutput)]
      });
      const logMeta = {
        someSet: new Set(["a","b", "a"])
      };

      logger1.info("test message", logMeta);
      logger2.info({level: "info", message: "test message", ...logMeta});

      assume(levelOutput).eqls(logOutput);
      assume(expectedOutput).eqls(levelOutput);
      assume(expectedOutput).eqls(logOutput);
    });
  });

  describe('Metadata Precedence', () => {
    describe('Single logger instance', () => {
      it('should log to passed array correctly when using the `inMemory` transport', () => {
        const expectedOutput = [
          {message: "some message", level: "info"},
          {message: "I'm a test", level: "warn"}
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)]
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)]
        });

        logger1.info("some message");
        logger1.warn("I'm a test");
        logger2.log({level: 'info', message: "some message"});
        logger2.log({level: 'warn', message: "I'm a test"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it('should include default metadata defined on the logger instance', () => {
        const expectedOutput = [
          {message: "some message", level: "info", defaultMeta: true},
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {defaultMeta: true}
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {defaultMeta: true}
        });

        logger1.info("some message");
        logger2.log({level: "info", message: "some message"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it('should include metadata log specific metadata', () => {
        const expectedOutput = [
          {message: "some message", level: "info", logMeta: true},
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
        });

        logger1.info("some message", {logMeta: true});
        logger2.log({level: "info", message: "some message", logMeta: true});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it('should include both default metadata & log specific metadata', () => {
        const expectedOutput = [
          {message: "some message", level: "info", defaultMeta: true, logMeta: true},
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {defaultMeta: true}
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {defaultMeta: true}
        });

        logger1.info("some message", {logMeta: true});
        logger2.log({level: "info", message: "some message", logMeta: true});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it('should include override default metadata with log specific metadata', () => {
        const expectedOutput = [
          {message: "some message", level: "info", defaultMeta: false},
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {defaultMeta: true}
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {defaultMeta: true}
        });

        logger1.info("some message", {defaultMeta: false});
        logger2.log({level: "info", message: "some message", defaultMeta: false});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });
    });

    describe('Multiple logger instances', () => {
      it('should log to passed array correctly when using the `inMemory` transport', () => {
        const expectedOutput = [
          {message: "some message", level: "info"},
          {message: "I'm a test", level: "warn"}
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)]
        });
        const logger1a = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)]
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)]
        });
        const logger2a = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)]
        });

        logger1.info("some message");
        logger1a.warn("I'm a test");
        logger2.log({level: "info", message: "some message"});
        logger2a.log({level: "warn", message: "I'm a test"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);      });

      it('should include default metadata defined on all logger instances', () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "logger1"},
          {message: "some message", level: "info", loggerName: "logger2"},
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "logger1"}
        });
        const logger1a = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "logger2"}
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "logger1"}
        });
        const logger2a = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "logger2"}
        });

        logger1.info("some message");
        logger1a.info("some message");
        logger2.log({level: "info", message: "some message"});
        logger2a.log({level: "info", message: "some message"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it('should include metadata log specific metadata', () => {
        const expectedOutput = [
          {message: "some message", level: "info", logMetadata: true},
          {message: "some message", level: "info", logMetadata: false},
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)]
        });
        const logger1a = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)]
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)]
        });
        const logger2a = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)]
        });

        logger1.info("some message", {logMetadata: true});
        logger1a.info("some message", {logMetadata: false});
        logger2.log({level: "info", message: "some message", logMetadata: true});
        logger2a.log({level: "info", message: "some message", logMetadata: false});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it('should include both default metadata & log specific metadata', () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "logger1", logMetadata: true},
          {message: "some message", level: "info", loggerName: "logger2", logMetadata: false},
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "logger1"}
        });
        const logger1a = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "logger2"}
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "logger1"}
        });
        const logger2a = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "logger2"}
        });

        logger1.info("some message", {logMetadata: true});
        logger1a.info("some message", {logMetadata: false});
        logger2.log({level: "info", message: "some message", logMetadata: true});
        logger2a.log({level: "info", message: "some message", logMetadata: false});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it('should include overridden default metadata with log specific metadata', () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "logger1-override"},
          {message: "some message", level: "info", loggerName: "logger2-override"},
        ];

        const logger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "logger1"}
        });
        const logger1a = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "logger2"}
        });
        const logger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "logger1"}
        });
        const logger2a = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "logger2"}
        });

        logger1.info("some message", {loggerName: "logger1-override"});
        logger1a.info("some message", {loggerName: "logger2-override"});
        logger2.log({level: "info", message: "some message", loggerName: "logger1-override"});
        logger2a.log({level: "info", message: "some message", loggerName: "logger2-override"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });
    });

    describe('Single child logger instance', () => {
      it("should inherit the parent's default metadata", () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "root"}, // root logger
          {message: "some message", level: "info", loggerName: "root"}, // child logger
        ];

        const rootLogger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger1 = rootLogger1.child();
        const rootLogger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger2 = rootLogger2.child();

        rootLogger1.info("some message");
        childLogger1.info("some message");
        rootLogger2.log({level: "info", message: "some message"});
        childLogger2.log({level: "info", message: "some message"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it("should not reflect changes to the parent's metadata if it changes after the child is created", () => {
        const expectedOutput = [
          {message: "some message", level: "info", label: "parent"}, // child logger
          {message: "some message", level: "info", label: "parent"}, // child logger
        ];

        const rootLogger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {label: "parent"}
        });
        const childLogger1 = rootLogger1.child();
        const rootLogger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {label: "parent"}
        });
        const childLogger2 = rootLogger2.child();

        childLogger1.info("some message");
        rootLogger1.defaultMeta = {
          defaultMeta: {label: "updatedLabel"}
        };
        childLogger1.info("some message");
        childLogger2.log({level: "info", message: "some message"});
        rootLogger2.defaultMeta = {
          defaultMeta: {label: "updatedLabel"}
        };
        childLogger2.log({level: "info", message: "some message"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it("should include both the parent's & child's default metadata", () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "root"}, // root logger
          {message: "some message", level: "info", loggerName: "root", isChild: true}, // child logger
        ];

        const rootLogger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger1 = rootLogger1.child({isChild: true});
        const rootLogger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger2 = rootLogger2.child({isChild: true});

        rootLogger1.info("some message");
        childLogger1.info("some message");
        rootLogger2.log({level: "info", message: "some message"});
        childLogger2.log({level: "info", message: "some message"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it("should override the parent's default metadata with the child's default metadata", () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "root"}, // root logger
          {message: "some message", level: "info", loggerName: "child"}, // child logger
        ];

        const rootLogger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger1 = rootLogger1.child({loggerName: "child"});
        const rootLogger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger2 = rootLogger2.child({loggerName: "child"});

        rootLogger1.info("some message");
        childLogger1.info("some message");
        rootLogger2.log({level: "info", message: "some message"});
        childLogger2.log({level: "info", message: "some message"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it("should override the parent's default metadata without affecting the parent", () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "child"}, // child logger
          {message: "some message", level: "info", loggerName: "child-override"}, // child logger overridden
          {message: "some message", level: "info", loggerName: "root"}, // root logger
        ];

        const rootLogger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger1 = rootLogger1.child({loggerName: "child"});
        const rootLogger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger2 = rootLogger2.child({loggerName: "child"});

        childLogger1.info("some message");
        childLogger1.info("some message", {loggerName: "child-override"});
        rootLogger1.info("some message");
        childLogger2.log({level: "info", message: "some message"});
        childLogger2.log({level: "info", message: "some message", loggerName: "child-override"});
        rootLogger2.log({level: "info", message: "some message"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it("should override the parent's default metadata with the log specific metadata", () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "root"}, // root logger
          {message: "some message", level: "info", loggerName: "child"}, // child logger
        ];

        const rootLogger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger1 = rootLogger1.child();
        const rootLogger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger2 = rootLogger2.child();

        rootLogger1.info("some message");
        childLogger1.info("some message", {loggerName: "child"});
        rootLogger2.log({level: "info", message: "some message"});
        childLogger2.log({level: "info", message: "some message", loggerName: "child"});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it("should override the child's default metadata with the log specific metadata", () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "root"}, // root logger
          {message: "some message", level: "info", loggerName: "root", isChild: null}, // child logger
        ];

        const rootLogger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger1 = rootLogger1.child({isChild: true});
        const rootLogger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger2 = rootLogger2.child({isChild: true});

        rootLogger1.info("some message");
        childLogger1.info("some message", {isChild: null});
        rootLogger2.log({level: "info", message: "some message"});
        childLogger2.log({level: "info", message: "some message", isChild: null});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });

      it("should override both the parent's & child's default metadata with the log specific metadata",
        () => {
        const expectedOutput = [
          {message: "some message", level: "info", loggerName: "root"}, // root logger
          {message: "some message", level: "info", loggerName: "child", isChild: null}, // child logger
        ];

        const rootLogger1 = winston.createLogger({
          transports: [mockTransports.inMemory(levelOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger1 = rootLogger1.child({isChild: true});
        const rootLogger2 = winston.createLogger({
          transports: [mockTransports.inMemory(logOutput)],
          defaultMeta: {loggerName: "root"}
        });
        const childLogger2 = rootLogger2.child({isChild: true});

        rootLogger1.info("some message");
        childLogger1.info("some message", {loggerName: "child", isChild: null});
        rootLogger2.log({level: "info", message: "some message"});
        childLogger2.log({level: "info", message: "some message", loggerName: "child", isChild: null});

        assume(levelOutput).eqls(logOutput);
        assume(expectedOutput).eqls(levelOutput);
        assume(expectedOutput).eqls(logOutput);
      });
    });

    describe('Multiple child logger instances', () => {
      it("should have independent default metadata that overrides the parent's", () => {
          const expectedOutput = [
            {message: "some message", level: "info", loggerInfo: {name: "root", isChild: false}}, // root logger
            {message: "some message", level: "info", loggerInfo: {name: "child1", isChild: true}}, // child1 logger
            {message: "some message", level: "info", loggerInfo: {name: "child1-override", isChild: false}}, // child1 logger override
            {message: "some message", level: "info", loggerInfo: {name: "child2", isChild: true}}, // child2 logger
            {message: "some message", level: "info", loggerInfo: {name: "child2-override", isChild: false}}, // child2 logger override
            {message: "some message", level: "info", loggerInfo: {name: "child3", isChild: true}}, // child3 logger
            {message: "some message", level: "info", loggerInfo: {name: "child3-override", isChild: false}}, // child3 logger override
            {message: "some message", level: "info", loggerInfo: {name: "root", isChild: false}}, // root logger
          ];

          const rootLogger1 = winston.createLogger({
            transports: [mockTransports.inMemory(levelOutput)],
            defaultMeta: {loggerInfo: {name: "root", isChild: false}}
          });
          const childLogger1 = rootLogger1.child({loggerInfo: {name: "child1", isChild: true}});
          const childLogger1a = rootLogger1.child({loggerInfo: {name: "child2", isChild: true}});
          const childLogger1b = rootLogger1.child({loggerInfo: {name: "child3", isChild: true}});
          const rootLogger2 = winston.createLogger({
            transports: [mockTransports.inMemory(logOutput)],
            defaultMeta: {loggerInfo: {name: "root", isChild: false}}
          });
          const childLogger2 = rootLogger2.child({loggerInfo: {name: "child1", isChild: true}});
          const childLogger2a = rootLogger2.child({loggerInfo: {name: "child2", isChild: true}});
          const childLogger2b = rootLogger2.child({loggerInfo: {name: "child3", isChild: true}});

          rootLogger1.info("some message");
          childLogger1.info("some message");
          childLogger1.info("some message", {loggerInfo: {name: "child1-override", isChild: false}});
          childLogger1a.info("some message");
          childLogger1a.info("some message", {loggerInfo: {name: "child2-override", isChild: false}});
          childLogger1b.info("some message");
          childLogger1b.info("some message", {loggerInfo: {name: "child3-override", isChild: false}});
          rootLogger1.info("some message");

          rootLogger2.log({level: "info", message: "some message"});
          childLogger2.log({level: "info", message: "some message"});
          childLogger2.log({level: "info", message: "some message", loggerInfo: {name: "child1-override", isChild: false}});
          childLogger2a.log({level: "info", message: "some message"});
          childLogger2a.log({level: "info", message: "some message", loggerInfo: {name: "child2-override", isChild: false}});
          childLogger2b.log({level: "info", message: "some message"});
          childLogger2b.log({level: "info", message: "some message", loggerInfo: {name: "child3-override", isChild: false}});
          rootLogger2.log({level: "info", message: "some message"});

          assume(levelOutput).eqls(logOutput);
          assume(expectedOutput).eqls(levelOutput);
          assume(expectedOutput).eqls(logOutput);
        });
    });
  });

  describe('Metadata application with formats', () => {
    describe('Printf Format', () => {
      it('should result in equivalent messages when using log() and [LEVEL]()', () => {
        const logger = winston.createLogger({
          level: "debug",
          defaultMeta: { id: 'APP', service: 'Authentication' },
          format: winston.format.combine(
              winston.format.printf(
                  info => `${info.service} - ${info.level}: [${info.id}] ${info.message}`
              )
          ),
          transports: [mockTransports.inMemory(levelOutput)]
        });

        logger.info("This is my info");
        logger.log({level: "info", message: "This is my info"});
        assume(levelOutput[0][MESSAGE]).eqls(levelOutput[1][MESSAGE]);
      });
    });
  })

  describe('Backwards Compatability', function () {
    describe('Winston V2 Log', function () {
      it('.log(level, message)', function (done) {
        let logger = helpers.createLogger(function (info) {
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
        let meta = {one: 2};
        let logger = helpers.createLogger(function (info) {
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

        let logger = helpers.createLogger(function (info) {
          assume(info).is.an('object');
          assume(info.level).equals('info');
          assume(info.message).equals('100% such wow {"much":"javascript"}');
          assume(info[SPLAT]).deep.equals([100, 'wow', {much: 'javascript'}]);
          assume(info[MESSAGE]).equals('info: 100% such wow {"much":"javascript"}');
          done();
        }, format);

        logger.log('info', '%d%% such %s %j', 100, 'wow', {much: 'javascript'});
      });

      it('.log(level, formatStr, ...splat, meta)', function (done) {
        const format = winston.format.combine(
            winston.format.splat(),
            winston.format.printf(info => `${info.level}: ${info.message} ${JSON.stringify({thisIsMeta: info.thisIsMeta})}`)
        );

        let logger = helpers.createLogger(function (info) {
          assume(info).is.an('object');
          assume(info.level).equals('info');
          assume(info.message).equals('100% such wow {"much":"javascript"}');
          assume(info[SPLAT]).deep.equals([100, 'wow', {much: 'javascript'}]);
          assume(info.thisIsMeta).true();
          assume(info[MESSAGE]).equals('info: 100% such wow {"much":"javascript"} {"thisIsMeta":true}');
          done();
        }, format);

        logger.log('info', '%d%% such %s %j', 100, 'wow', {much: 'javascript'}, {thisIsMeta: true});
      });
    });
  });
});
