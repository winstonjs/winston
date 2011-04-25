/*
 * logger-test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('winston'),
    helpers = require('./helpers');

vows.describe('winton/logger').addBatch({
  "An instance of winston.Logger": {
    topic: new (winston.Logger)({ transports: [new (winston.transports.Console)({ level: 'info' })] }), 
    "should have the correct methods / properties defined": function (logger) {
      helpers.assertLogger(logger);
    },
    "the add() with an unsupported transport": {
      "should throw an error": function () {
        assert.throws(function () { logger.add('unsupported') }, Error);
      }
    }
  }
}).addBatch({
  "An instance of winston.Logger with no transports": {
    topic: new (winston.Logger)(),
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
        ['log', 'profile'].concat(Object.keys(winston.config.npm.levels)).forEach(function (method) {
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
      "the log() method": {
        topic: function (logger) {
          logger.once('log', this.callback);
          logger.log('info', 'test message');
        },
        "should emit the 'log' event with the appropriate transport": function (transport, ign) {
          helpers.assertConsole(transport);
        }
      },
      "the profile() method": {
        "when passed a callback": {
          topic: function (logger) {
            var that = this;
            logger.profile('test1');
            setTimeout(function () {
              logger.profile('test1', function (err, level, msg, meta) {
                that.callback(err, level, msg, meta, logger);
              });
            }, 1000);
          },
          "should respond with the appropriate profile message": function (err, level, msg, meta, logger) {
            assert.isNull(err);
            assert.equal(level, 'info');
            assert.match(meta.duration, /(\d+)ms/);
            assert.isTrue(typeof logger.profilers['test'] === 'undefined');
          }
        },
        "when not passed a callback": {
          topic: function (logger) {
            var that = this;
            logger.profile('test2');
            logger.once('log', that.callback.bind(null, null));
            setTimeout(function () {
              logger.profile('test2');
            }, 1000);
          },
          "should respond with the appropriate profile message": function (err, transport, level, msg, meta) {
            assert.isNull(err);
            assert.equal(level, 'info');
            assert.match(meta.duration, /(\d+)ms/);
          }
        }
      },
      "and adding an additional transport": {
        topic: function (logger) {       
          return logger.add(winston.transports.File, { 
            filename: path.join(__dirname, 'testfile2.log') 
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
  "winston.Logger#withContext": {
    topic: function() {
      var logger = new (winston.Logger)({ 
        transports: [
          new (winston.transports.Console)(),
        ] 
      });
      return logger.withContext('clone');
    },
    "it should create a copy of the logger": function(clone) {
      assert.isObject(clone);
      assert.isObject(clone.__original__);
      assert.notEqual(clone, clone.__original__);
    },
    "and push provided context to the copy instance only": function(clone) {
      assert.length(clone.__original__.context,  0);
      assert.length(clone.context,               1);
    }
  }
}).addBatch({
  "When winston.Logger with transports": {
    topic: new (winston.Logger)({ 
      transports: [
        new (winston.transports.Console)(),
      ] 
    }),
    "calls push() method": {
      topic: function (logger) {
        return logger.push('con').push('t').push('ext');
      },
      "it should add specified context to the stack": function (logger) {
        assert.length(logger.context, 3);
      },
      "and then calls log() method": {
        topic: function (logger) {
          logger.log('info', 'test message', this.callback);
        },
        "message should be prefixed with specified context": function (err, lvl, msg) {
          assert.match(msg, /\[con::t::ext\]/);
        }
      },
      "and then calls pop() method": {
        topic: function (logger) {
          return logger.pop();
        },
        "should pop one last context out": function (logger) {
          assert.length(logger.context, 2);
        },
        "until there no more contexts left, calling log() method": {
          topic: function (logger) {
            logger.pop(-1).log('info', 'test message', this.callback);
          },
          "should log message without any prefix": function (err, lvl, msg) {
            assert.equal(msg, 'test message');
          }
        }
      }
    }
  }
}).addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({ 
      transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: path.join(__dirname, 'filelog.log' )})
      ] 
    }),
    "should return have two transports": function(logger) {
      assert.equal(helpers.size(logger.transports), 2);
    },
    "the remove() with an unadded transport": {
      "should throw an Error": function (logger) {
        assert.throws(function () { logger.remove(winston.transports.Loggly) }, Error);
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
}).export(module);
