/*
 * logger-test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assert = require('assert'),
    path = require('path'),
    util = require('util'),
    stdMocks = require('std-mocks'),
    vows = require('vows'),
    winston = require('../lib/winston'),
    helpers = require('./helpers'),
    transport = require('./transports/transport');

vows.describe('winton/logger').addBatch({
  "An instance of winston.Logger": {
    "with transports": {
      topic: new (winston.Logger)({ transports: [new (winston.transports.Console)({ level: 'info' })] }),
      "should have the correct methods / properties defined": function (logger) {
        helpers.assertLogger(logger);
      },
      "the add() with an unsupported transport": {
        "should throw an error": function () {
          assert.throws(function () { logger.add('unsupported') }, Error);
        }
      }
    },
    "with no transports": {
      topic: new winston.Logger(),
      "the log method": {
        topic: function (logger) {
          var that = this;
          logger.log('error', 'This should be an error', function (err) {
            that.callback(null, err);
          });
        },
        "should respond with the appropriate error": function (err) {
          assert.instanceOf(err, Error);
        }
      }
    }
  }
}).addBatch({
  "An instance of winston.Logger": {
    topic: new (winston.Logger)({ transports: [new (winston.transports.Console)({ level: 'info' })] }),
    "the log() method": {
      "when listening for the 'logging' event": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message');
        },
        "should emit the 'log' event with the appropriate transport": function (transport, ign) {
          helpers.assertConsole(transport);
        }
      },
      "when listening for the 'logged' event": {
        topic: function (logger) {
          logger.once('logged', this.callback);
          logger.log('info', 'test message');
        },
        "should emit the 'logged' event": function (level, msg, meta) {
          assert.equal(level, 'info');
          assert.equal(msg, 'test message');
        }
      },
    }
  }
}).addBatch({
  "An instance of winston.Logger with no transports": {
    topic: new (winston.Logger)({ emitErrs: true }),
    "the log() method should throw an error": function (logger) {
      assert.throws(function () { logger.log('anything') }, Error);
    },
    "the extend() method called on an empty object": {
      topic: function (logger) {
        var empty = {};
        logger.extend(empty);
        return empty;
      },
      "should define the appropriate methods": function (extended) {
        ['log', 'profile', 'startTimer'].concat(Object.keys(winston.config.npm.levels)).forEach(function (method) {
          assert.isFunction(extended[method]);
        });
      }
    },
    "the add() method with a supported transport": {
      topic: function (logger) {
        return logger.add(winston.transports.Console);
      },
      "should add the console Transport onto transports": function (logger) {
        assert.equal(helpers.size(logger.transports), 1);
        helpers.assertConsole(logger.transports.console);
      },
      "should throw an error when the same Transport is added": function (logger) {
        assert.throws(function () { logger.add(winston.transports.Console) }, Error);
      },
      "the profile() method": {
        "when passed a callback": {
          topic: function (logger) {
            var cb = this.callback;
            logger.profile('test1');
            setTimeout(function () {
              logger.profile('test1', function (err, level, msg, meta) {
                cb(err, level, msg, meta, logger);
              });
            }, 50);
          },
          "should respond with the appropriate profile message": function (err, level, msg, meta, logger) {
            assert.isNull(err);
            assert.equal(level, 'info');
            assert.isTrue(typeof logger.profilers['test'] === 'undefined');
          },
          "when passed some metadata": {
            topic: function () {
              var logger = arguments[arguments.length - 1];
              var cb = this.callback.bind(null, null);
              logger.profile('test3');
              setTimeout(function () {
                logger.once('logging', cb);
                logger.profile('test3', {
                  some: 'data'
                });
              }, 50);
            },
            "should respond with the right metadata": function (err, transport, level, msg, meta) {
              assert.equal(msg, 'test3');
              assert.isNull(err);
              assert.equal(level, 'info');
              assert.equal(meta.some, 'data');
            },
            "when not passed a callback": {
              topic: function () {
                var logger = arguments[arguments.length - 1];
                var cb = this.callback.bind(null, null);
                logger.profile('test2');
                setTimeout(function () {
                  logger.once('logging', cb);
                  logger.profile('test2');
                }, 50);
              },
              "should respond with the appropriate profile message": function (err, transport, level, msg, meta) {
                assert.isNull(err);
                assert.equal(msg, 'test2');
                assert.equal(level, 'info');
              }
            }
          }
        }
      },
      "the startTimer() method": {
        "when passed a callback": {
          topic: function (logger) {
            var that = this;
            var timer = logger.startTimer()
            setTimeout(function () {
              timer.done('test', function (err, level, msg, meta) {
                that.callback(err, level, msg, meta, logger);
              });
            }, 500);
          },
          "should respond with the appropriate message": function (err, level, msg, meta, logger) {
            assert.isNull(err);
            assert.equal(level, 'info');
          }
        },
        "when not passed a callback": {
          topic: function (logger) {
            var that = this;
            var timer = logger.startTimer()
            logger.once('logging', that.callback.bind(null, null));
            setTimeout(function () {
              timer.done();
            }, 500);
          },
          "should respond with the appropriate message": function (err, transport, level, msg, meta) {
            assert.isNull(err);
            assert.equal(level, 'info');

            assert.isNumber(meta.durationMs);
            assert.isTrue(meta.durationMs >= 50 && meta.durationMs < 100);
          }
        }
      },
      "and adding an additional transport": {
        topic: function (logger) {
          return logger.add(winston.transports.File, {
            filename: path.join(__dirname, 'fixtures', 'logs', 'testfile2.log')
          });
        },
        "should be able to add multiple transports": function (logger) {
          assert.equal(helpers.size(logger.transports), 2);
          helpers.assertConsole(logger.transports.console);
          helpers.assertFile(logger.transports.file);
        }
      }
    }
  }
}).addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({
      transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log' )})
      ]
    }),
    "should return have two transports": function (logger) {
      assert.equal(helpers.size(logger.transports), 2);
    },
    "the remove() with an unadded transport": {
      "should throw an Error": function (logger) {
        assert.throws(function () { logger.remove(winston.transports.Webhook) }, Error);
      }
    },
    "the remove() method with an added transport": {
      topic: function (logger) {
         return logger.remove(winston.transports.Console);
      },
      "should remove the Console transport from transports": function (logger) {
        assert.equal(helpers.size(logger.transports), 1);
        helpers.assertFile(logger.transports.file);
      },
      "and removing an additional transport": {
        topic: function (logger) {
           return logger.remove(winston.transports.File);
        },
        "should remove File transport from transports": function (logger) {
          assert.equal(helpers.size(logger.transports), 0);
        }
      }
    }
  }
}).addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({
      transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log' )})
      ]
    }),
    "the clear() method": {
      "should remove all transports": function (logger) {
        logger.clear();
        assert.equal(helpers.size(logger.transports), 0);
      }
    }
  }
}).addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({
      exceptionHandlers: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log' )})
      ]
    }),
    "the unhandleExceptions() method": {
      "should remove all transports": function (logger) {
        assert.equal(helpers.size(logger.exceptionHandlers), 2);
        logger.unhandleExceptions();
        assert.equal(helpers.size(logger.exceptionHandlers), 0);
      }
    }
  }
}).addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({
      transports: [
        new (winston.transports.Console)()
      ]
    }),
    "the log() method": {
      "when passed an Error object as meta": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'An error happened: ', new Error('I am something bad'));
        },
        "should respond with a proper error output": function (transport, level, msg, meta) {
          assert.instanceOf(meta, Error);
        }
      },
      "when passed a string placeholder": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %s', 'my string');
        },
        "should interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message my string');
        },
      },
      "when passed a number placeholder": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %d', 123);
        },
        "should interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message 123');
        },
      },
      "when passed a json placholder and an empty object": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %j', {number: 123}, {});
        },
        "should interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message {"number":123}');
        },
      },
      "when passed just JSON meta and no message": {
        topic: function (logger) {
          stdMocks.use();
          logger.once('logging', this.callback);
          logger.log('info', { message: 'in JSON object', ok: true });
        },
        "should output the message": function (transport, level, msg, meta) {
          stdMocks.restore();

          //
          // TODO: Come up with a cleaner way to test this.
          //
          var output = stdMocks.flush(),
              line   = output.stdout[0];

          assert.match(line, /message\=in/);
        }
      },
      "when passed a escaped percent sign": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %%', {number: 123});
        },
        "should not interpolate": function (transport, level, msg, meta) {
          assert.strictEqual(msg, util.format('test message %%'));
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed interpolation strings and a meta object": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message %s, %s', 'first', 'second' ,{number: 123});
        },
        "should interpolate and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first, second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed multiple strings and a meta object": {
        topic: function (logger) {
          logger.once('logging', this.callback);
          logger.log('info', 'test message', 'first', 'second' , {number: 123});
        },
        "should join and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed interpolations strings, meta object and a callback": {
        topic: function (logger) {
          var that = this;
          logger.log('info', 'test message %s, %s', 'first', 'second' , {number: 123}, function(transport, level, msg, meta){
            that.callback(transport, level, msg, meta)
          });
        },
        "should interpolate and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first, second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed multiple strings, a meta object and a callback": {
        topic: function (logger) {
          var that = this;
          logger.log('info', 'test message', 'first', 'second' , {number: 123}, function(transport, level, msg, meta){
            that.callback(transport, level, msg, meta)
          });
        },
        "should join and have a meta object": function (transport, level, msg, meta) {
          assert.strictEqual(msg, 'test message first second');
          assert.deepEqual(meta, {number: 123});
        },
      },
      "when passed a regular expression": {
        topic: function (logger) {
          var that = this;
          logger.log('info', new RegExp('a'), function(transport, level, msg, meta){
            that.callback(transport, level, msg, meta)
          });
        },
        "should return a string representing the regular expression": function (transport, level, msg, meta) {
          assert.strictEqual(msg, '/a/');
        },
      }
    }
  }
}).addBatch({
  "Building a logger with two file transports": {
    topic: new (winston.Logger)({
      transports: [
        new (winston.transports.File)({
          name: 'filelog-info.log',
          filename: path.join(__dirname, 'fixtures', 'logs', 'filelog-info.log'),
          level: 'info'
        }),
        new (winston.transports.File)({
          name: 'filelog-error.log',
          filename: path.join(__dirname, 'fixtures', 'logs', 'filelog-error.log'),
          level: 'error'
        })
      ]
    }),
    "should respond with a proper logger": function (logger) {
      assert.include(logger._names, 'filelog-info.log');
      assert.include(logger._names, 'filelog-error.log');
      assert.lengthOf(logger.transports, 2);
    },
    "when one is removed": {
      topic: function (logger) {
        logger.remove('filelog-error.log');
        return logger;
      },
      "should only have one transport": function (logger) {
        assert.include(logger._names, 'filelog-info.log');
        assert.lengthOf(logger.transports, 1);
      }
    }
  }
}).export(module);
