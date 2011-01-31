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
        return {extended: empty, levels: logger.levels};
      },
      "should define the appropriate methods": function (object) {
        var levels = object.levels;
        var extended = object.extended;
        ['log', 'profile'].concat(Object.keys(levels)).forEach(function (method) {
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
  "The winston logger": {
    topic: new (winston.Logger)({ 
      transports: [
        new (winston.transports.Console)(),
        new (winston.transports.Riak)()
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
        helpers.assertRiak(logger.transports.riak);
      },
      "and removing an additional transport": {
        topic: function (logger) {
           return logger.remove(winston.transports.Riak);  
        },
        "should remove Riak transport from transports": function (logger) {
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
        new (winston.transports.Riak)()
      ] 
    }),
    "the setLevel() method with no options": {
      topic: function(logger) {
        var logger = new (winston.Logger);
        return logger.setLevel('new');
      },
      "should add level to the Logger": function(logger) {
        assert.isNotNull(logger.levels['new']);
      }, 
      "should add the level log function to the logger": function(logger) {
        assert.isFunction(logger.new);
      },
      "should increment the levels for the logger correctly": function(logger) {
        assert.equal(logger.levels['new'], 0);
        assert.equal(logger.levels['silly'], 1);
        assert.equal(logger.levels['verbose'], 2);
        assert.equal(logger.levels['info'], 3);
        assert.equal(logger.levels['warn'], 4);
        assert.equal(logger.levels['debug'], 5);
        assert.equal(logger.levels['error'], 6);

      }, 
      "should not effect the winston library default levels or functions": function(logger) {
        assert.isUndefined(winston.new);
      },
    },
    "the setLevel() method with position option": {
       topic: function(logger) {
        logger = new (winston.Logger);
        return logger.setLevel('new', {position: 4});
      },
      "should increment the levels for the logger correctly": function (logger) {
        assert.equal(logger.levels['silly'], 0);
        assert.equal(logger.levels['verbose'], 1);
        assert.equal(logger.levels['info'], 2);
        assert.equal(logger.levels['warn'], 3);
        assert.equal(logger.levels['new'], 4);
        assert.equal(logger.levels['debug'], 5);
        assert.equal(logger.levels['error'], 6);
      }
    },
    "the setLevel() method being called with an already set level": {
        topic: function(logger) {
          logger = new (winston.Logger);
          return logger.setLevel('silly', {position: 4});
        }, 
        "It should remove the level and set it by the options given": function (logger) {
          assert.equal(logger.levels['verbose'], 0);
          assert.equal(logger.levels['info'], 1);
          assert.equal(logger.levels['warn'], 2);
          assert.equal(logger.levels['debug'], 3);
          assert.equal(logger.levels['silly'], 4);
          assert.equal(logger.levels['error'], 5);
        }
    },
    "the setLevel() method being called with position set to greater then the available methods": {
        topic: function(logger) {
          logger = new (winston.Logger);
          return logger.setLevel('insane', {position: 20});
        }, 
        "It set the level last": function (logger) {
          assert.equal(logger.levels['silly'], 0);

          assert.equal(logger.levels['silly'], 0);
          assert.equal(logger.levels['verbose'], 1);
          assert.equal(logger.levels['info'], 2);
          assert.equal(logger.levels['warn'], 3);
          assert.equal(logger.levels['debug'], 4);
          assert.equal(logger.levels['error'], 5);
          assert.equal(logger.levels['insane'], 6);
        }
    }
  }
}).addBatch({
  "The winston logger": {
    topic: new (winston.Logger)({ 
      transports: [
        new (winston.transports.Console)(),
        new (winston.transports.Riak)()
      ] 
    }),
    "the removeLevel() method": {
      topic: function(logger) {
        var logger = new (winston.Logger);
        return logger.removeLevel('warn');
      },
      "should remove level from the Logger": function(logger) {
        assert.isUndefined(logger.levels['warn']);
      }, 
      "should remove the level log function to the logger": function(logger) {
        assert.isUndefined(logger.warn);
      },
      "should decrement the levels for the logger correctly": function(logger) {
        assert.equal(logger.levels['silly'], 0);
        assert.equal(logger.levels['verbose'], 1);
        assert.equal(logger.levels['info'], 2);
        assert.equal(logger.levels['debug'], 3);
        assert.equal(logger.levels['error'], 4);

      }, 
      "should not effect the winston library default levels or functions": function(logger) {
        assert.isFunction(winston.warn);
        assert.isNumber(winston.levels['warn']);
      },
    },
    "should reset the logging level of the Logger if set level is removed": function(logger) {
      var logger = new (winston.Logger);
      logger.removeLevel(logger.level);
      assert.equal(logger.level, 'warn');
    },
    "the removeLevel() with a undefined level": {
      "should throw an Error": function (logger) {
        assert.throws(function () { logger.removeLevel('fake') }, Error);
      }
    }
  }
}).export(module);