/*
 * log-stream.test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

var assume = require('assume'),
    path = require('path'),
    util = require('util'),
    isStream = require('isstream'),
    stdMocks = require('std-mocks'),
    winston = require('../lib/winston'),
    TransportStream = require('../lib/winston/transport-stream'),
    format = require('../lib/winston/formats/format');

describe('LogStream', function () {
  it('new LogStream()', function () {
    var logger = new winston.LogStream();
    assume(logger).is.an('object');
    assume(isStream(logger.format));
    assume(logger.level).equals('info');
    assume(logger.exitOnError).equals(true);
  });

  it('new LogStream({ parameters })', function () {
    var myFormat = format(function (info, opts) {
      return info;
    })();

    var logger = new winston.LogStream({
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

  it('.add(LegacyTransportStream)', function () {
    stdMocks.use();
    var logger = new winston.LogStream();
    var transport = new winston.transports.Console();
    logger.add(transport);
    stdMocks.restore();
    var output = stdMocks.flush();

    assume(logger._readableState.pipesCount).equals(1);
    assume(logger._readableState.pipes).equals(transport);
    assume(output.stderr).deep.equals(['console is a Legacy winston transport. Consider upgrading\n']);
  });

  it('.add(LegacyTransportStream) multiple', function () {
    stdMocks.use();
    var logger = new winston.LogStream({
      transports: [
        new winston.transports.Console(),
        new winston.transports.Console(),
        new winston.transports.Console()
      ]
    });
    stdMocks.restore();
    var output = stdMocks.flush();

    assume(logger._readableState.pipesCount).equals(3);
    var errorMsg = 'console is a Legacy winston transport. Consider upgrading\n';
    assume(output.stderr).deep.equals([errorMsg, errorMsg, errorMsg]);
  });

  it('.add({ invalid Transport })', function () {
    var logger = new winston.LogStream();
    assume(function () {
      logger.add(5);
    }).throws(/invalid transport/i);
  });

  it('.add(TransportStream)', function (done) {
    var logger = new winston.LogStream();
    var expected = { msg: 'foo', level: 'info' };
    var transport = new TransportStream({
      log: function (info) {
        assume(info.msg).equals('foo');
        assume(info.level).equals('info');
        assume(info.raw).equals(JSON.stringify({ msg: 'foo', level: 'info' }));
        done();
      }
    });

    logger.add(transport);
    logger.log(expected);
  });

  //
  // TODO: Reimplement .configure() tests below in mocha
  //
  // "An instance of winston.Logger": {
  //   topic: new (winston.Logger)({ transports: [new (winston.transports.Console)({ level: 'info' })] }),
  //   "the configure() method": {
  //     "with no options": function (logger) {
  //       assert.equal(Object.keys(logger.transports).length, 1);
  //       assert.deepEqual(logger._names, ['console']);
  //       logger.configure();
  //       assert.equal(Object.keys(logger.transports).length, 0);
  //       assert.deepEqual(logger._names, []);
  //     },
  //     "with options { transports }": function (logger) {
  //       assert.equal(Object.keys(logger.transports).length, 0);
  //       assert.deepEqual(logger._names, []);
  //       logger.configure({
  //         transports: [new winston.transports.Console({ level: 'verbose' })]
  //       });
  //       assert.equal(Object.keys(logger.transports).length, 1);
  //       assert.deepEqual(logger._names, ['console']);
  //     }
  //   }
  // }

  //
  // TODO: Reimplement the .remove() tests below in mocha
  //
  // "The winston logger": {
  //   topic: new (winston.Logger)({
  //     transports: [
  //       new (winston.transports.Console)(),
  //       new (winston.transports.File)({ filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log' )})
  //     ]
  //   }),
  //   "should return have two transports": function (logger) {
  //     assert.equal(helpers.size(logger.transports), 2);
  //   },
  //   "the remove() with an unadded transport": {
  //     "should throw an Error": function (logger) {
  //       assert.throws(function () { logger.remove(winston.transports.Http) }, Error);
  //     }
  //   },
  //   "the remove() method with an added transport": {
  //     topic: function (logger) {
  //        return logger.remove(winston.transports.Console);
  //     },
  //     "should remove the Console transport from transports": function (logger) {
  //       assert.equal(helpers.size(logger.transports), 1);
  //       helpers.assertFile(logger.transports.file);
  //     },
  //     "and removing an additional transport": {
  //       topic: function (logger) {
  //          return logger.remove(winston.transports.File);
  //       },
  //       "should remove File transport from transports": function (logger) {
  //         assert.equal(helpers.size(logger.transports), 0);
  //       }
  //     }
  //   }
  // }

  //
  // TODO: Reimplement .clear() tests below in mocha
  //
  // "The winston logger": {
  //   topic: new (winston.Logger)({
  //     transports: [
  //       new (winston.transports.Console)(),
  //       new (winston.transports.File)({ filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log' )})
  //     ]
  //   }),
  //   "the clear() method": {
  //     "should remove all transports": function (logger) {
  //       logger.clear();
  //       assert.equal(helpers.size(logger.transports), 0);
  //     }
  //   }
  // }

  //
  // TODO: Reimplement multiple file transport tests below in mocha.
  //
  // "Building a logger with two file transports": {
  //   topic: new (winston.Logger)({
  //     transports: [
  //       new (winston.transports.File)({
  //         name: 'filelog-info.log',
  //         filename: path.join(__dirname, 'fixtures', 'logs', 'filelog-info.log'),
  //         level: 'info'
  //       }),
  //       new (winston.transports.File)({
  //         name: 'filelog-error.log',
  //         filename: path.join(__dirname, 'fixtures', 'logs', 'filelog-error.log'),
  //         level: 'error'
  //       })
  //     ]
  //   }),
  //   "should respond with a proper logger": function (logger) {
  //     assert.include(logger._names, 'filelog-info.log');
  //     assert.include(logger._names, 'filelog-error.log');
  //     assert.lengthOf(logger.transports, 2);
  //   },
  //   "when one is removed": {
  //     topic: function (logger) {
  //       logger.remove('filelog-error.log');
  //       return logger;
  //     },
  //     "should only have one transport": function (logger) {
  //       assert.include(logger._names, 'filelog-info.log');
  //       assert.lengthOf(logger.transports, 1);
  //     }
  //   }
  // }
});

describe('LogStream (levels)', function () {
  it('report unknown levels', function () {
    stdMocks.use();
    var logger = new winston.LogStream();
    var expected = { msg: 'foo', level: 'bar' };
    logger.log(expected);

    stdMocks.restore();
    var output = stdMocks.flush();

    assume(output.stderr).deep.equals(['Unknown logger level: bar\n']);
  });

  it('default levels', function (done) {
    var logger = new winston.LogStream();
    var expected = {msg: 'foo', level: 'info'};

    function logLevelTransport(level) {
      return new TransportStream({
        level: level,
        log: function (obj) {
          if (level === 'debug') {
            assume(obj).equals(undefined, 'Transport on level debug should never be called');
          }

          assume(obj.msg).equals('foo');
          assume(obj.level).equals('info');
          assume(obj.raw).equals(JSON.stringify({msg: 'foo', level: 'info'}));
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
    var logger = new winston.LogStream({
      levels: {
        missing: 0,
        bad:     1,
        test:    2
      }
    });

    var expected = { msg: 'foo', level: 'missing' };
    function logLevelTransport(level) {
      return new TransportStream({
        level: level,
        log: function (obj) {
          if (level === 'test') {
            assume(obj).equals(undefined, 'transport on level test should never be called');
          }

          assume(obj.msg).equals('foo');
          assume(obj.level).equals('missing');
          assume(obj.raw).equals(JSON.stringify({msg: 'foo', level: 'missing'}));
          done();
        }
      });
    }

    assume(logger.missing).is.a('function');
    assume(logger.bad).is.a('function');
    assume(logger.test).is.a('function');

    logger
      .add(logLevelTransport('test'))
      .add(logLevelTransport('missing'))
      .log(expected);
  });
});

describe('LogStream (profile, startTimer)', function () {
  it('profile()');
  it('profile(callback)');
  it('startTimer()');
  it('startTimer(callback)');
  //
  // TODO: Reimplement the .profile() and .startTimer() tests below in mocha
  //
  // "An instance of winston.Logger with no transports": {
  //   "the profile() method": {
  //     "when passed a callback": {
  //       topic: function (logger) {
  //         var cb = this.callback;
  //         logger.profile('test1');
  //         setTimeout(function () {
  //           logger.profile('test1', function (err, level, msg, meta) {
  //             cb(err, level, msg, meta, logger);
  //           });
  //         }, 50);
  //       },
  //       "should respond with the appropriate profile message": function (err, level, msg, meta, logger) {
  //         assert.isNull(err);
  //         assert.equal(level, 'info');
  //         assert.isTrue(typeof logger.profilers['test'] === 'undefined');
  //       },
  //       "when passed some metadata": {
  //         topic: function () {
  //           var logger = arguments[arguments.length - 1];
  //           var cb = this.callback.bind(null, null);
  //           logger.profile('test3');
  //           setTimeout(function () {
  //             logger.once('logging', cb);
  //             logger.profile('test3', {
  //               some: 'data'
  //             });
  //           }, 50);
  //         },
  //         "should respond with the right metadata": function (err, transport, level, msg, meta) {
  //           assert.equal(msg, 'test3');
  //           assert.isNull(err);
  //           assert.equal(level, 'info');
  //           assert.equal(meta.some, 'data');
  //         },
  //         "when not passed a callback": {
  //           topic: function () {
  //             var logger = arguments[arguments.length - 1];
  //             var cb = this.callback.bind(null, null);
  //             logger.profile('test2');
  //             setTimeout(function () {
  //               logger.once('logging', cb);
  //               logger.profile('test2');
  //             }, 50);
  //           },
  //           "should respond with the appropriate profile message": function (err, transport, level, msg, meta) {
  //             assert.isNull(err);
  //             assert.equal(msg, 'test2');
  //             assert.equal(level, 'info');
  //           }
  //         }
  //       }
  //     },
  //     "the startTimer() method": {
  //       "when passed a callback": {
  //         topic: function (logger) {
  //           var that = this;
  //           var timer = logger.startTimer()
  //           setTimeout(function () {
  //             timer.done('test', function (err, level, msg, meta) {
  //               that.callback(err, level, msg, meta, logger);
  //             });
  //           }, 500);
  //         },
  //         "should respond with the appropriate message": function (err, level, msg, meta, logger) {
  //           assert.isNull(err);
  //           assert.equal(level, 'info');
  //         }
  //       },
  //       "when not passed a callback": {
  //         topic: function (logger) {
  //           var that = this;
  //           var timer = logger.startTimer();
  //           logger.once('logging', that.callback.bind(null, null));
  //           setTimeout(function () {
  //             timer.done();
  //           }, 500);
  //         },
  //         "should respond with the appropriate message": function (err, transport, level, msg, meta) {
  //           assert.isNull(err);
  //           assert.equal(level, 'info');
  //
  //           assert.isNumber(meta.durationMs);
  //           assert.isTrue(meta.durationMs >= 50 && meta.durationMs < 100);
  //         }
  //       }
  //     }
  //   }
  // }
});
