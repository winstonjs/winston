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
    
vows.describe('winston').addBatch({
  "The winston module": {
    topic: function () {
      winston.defaultTransports().console.level = 'silly';
      return null;
    },
    "should have the correct methods defined": function () {
      assert.isObject(winston.transports);
      assert.isFunction(winston.transports.Console);
      assert.isFunction(winston.transports.Loggly);
      assert.isFunction(winston.transports.Riak);
      assert.isObject(winston.defaultTransports().console);
      assert.isFalse(winston.emitErrs);
      assert.isObject(winston.levels);
      assert.equal(winston.defaultLogLevels, 'npm');
      ['Logger', 'defaultTransports', 'add', 'remove', 'removeLevel', 'setLevel']
        .concat(Object.keys(winston.levels))
        .forEach(function (m) {
          assert.isFunction(winston[m]);
        });
    },
    "the log() method": helpers.testLevels(winston, "should respond without an error", function (err) {
      assert.isNull(err);
    }),
    "the extend() method called on an empty object": {
      topic: function (logger) {
        var empty = {};
        winston.extend(empty);
        return empty;
      },
      "should define the appropriate methods": function (extended) {
        ['log', 'profile'].concat(Object.keys(winston.levels)).forEach(function (method) {
          assert.isFunction(extended[method]);
        });
      }
    }
  }
}).addBatch({
  "setDefaultLevels should throw an error if levelType is not supported": function() {
    assert.throws(function () { winston.setDefaultLevels('fake') }, Error);
  },
  "the setDefaultLevels('npm') method": {
    topic: function() {
      winston.setLevel("new", {position: 4})
      return winston.setDefaultLevels('npm');
    },
    "should reset the levels and logger functions to npm": function(logger) {
      assert.isUndefined(winston.levels['new']);
      assert.equal(winston.levels['silly'], 0);
      assert.equal(winston.levels['verbose'], 1);
      assert.equal(winston.levels['info'], 2);
      assert.equal(winston.levels['warn'], 3);
      assert.equal(winston.levels['debug'], 4);
      assert.equal(winston.levels['error'], 5);

    }, 
    "should effect any logger created from this winston instance unless levels are specified": function(logger) {
      assert.isUndefined(winston.new);
    },
    "the setDefaultLevels('syslog') method": {
      topic: function() {
        winston.setLevel("new", {position: 4})
        return winston.setDefaultLevels('syslog');
      },
      "should reset the levels and logger functions to syslog": function() {
        assert.isUndefined(winston.levels['new']);
        assert.equal(winston.levels['debug'], 0);
        assert.equal(winston.levels['info'], 1);
        assert.equal(winston.levels['notice'], 2);
        assert.equal(winston.levels['warning'], 3);
        assert.equal(winston.levels['error'], 4);
        assert.equal(winston.levels['crit'], 5);
        assert.equal(winston.levels['alert'], 6);
        assert.equal(winston.levels['emerg'], 7);
      }
    }
  }
}).addBatch({
  "the setLevel() method with no options": {
    topic: function() {
      winston.setDefaultLevels('npm');
      return winston.setLevel('new');
    },
    "should add level to the Logger": function() {
      assert.isNumber(winston.levels['new']);
    }, 
    "should add the level log function to the logger": function() {
      assert.isFunction(winston.new);
    },
    "should increment the levels for the logger correctly": function() {
      assert.equal(winston.levels['new'], 0);
      assert.equal(winston.levels['silly'], 1);
      assert.equal(winston.levels['verbose'], 2);
      assert.equal(winston.levels['info'], 3);
      assert.equal(winston.levels['warn'], 4);
      assert.equal(winston.levels['debug'], 5);
      assert.equal(winston.levels['error'], 6);

    }, 
    "should effect any logger created from this winston instance unless levels are specified": function() {
      var logger = new winston.Logger();
      assert.isFunction(logger.new);
    },
  }
}).addBatch({
  "the setLevel() method with position option": {
     topic: function() {
       winston.setDefaultLevels('npm');
      return winston.setLevel('friendly', {position: 5});
    },
    "should increment the levels for the logger correctly": function () {
      assert.equal(winston.levels['silly'], 0);
      assert.equal(winston.levels['verbose'], 1);
      assert.equal(winston.levels['info'], 2);
      assert.equal(winston.levels['warn'], 3);
      assert.equal(winston.levels['debug'], 4);
      assert.equal(winston.levels['friendly'], 5);
      assert.equal(winston.levels['error'], 6);
    }
  }
}).addBatch({
  "the setLevel() method being called with an already set level": {
      topic: function() {
        winston.setDefaultLevels('npm');
        return winston.setLevel('silly', {position: 4});
      }, 
      "It should remove the level and set it by the options given": function () {
        assert.equal(winston.levels['verbose'], 0);
        assert.equal(winston.levels['info'], 1);
        assert.equal(winston.levels['warn'], 2);
        assert.equal(winston.levels['debug'], 3);
        assert.equal(winston.levels['silly'], 4);
        assert.equal(winston.levels['error'], 5);
      }
  }
}).addBatch({
  "the setLevel() method being called with position set to greater then the available methods": {
     topic: function() {
      winston.setDefaultLevels('npm');
      return winston.setLevel('insane', {position: 20});
    }, 
    "It set the level last": function () {
      assert.equal(winston.levels['silly'], 0);
      assert.equal(winston.levels['verbose'], 1);
      assert.equal(winston.levels['info'], 2);
      assert.equal(winston.levels['warn'], 3);
      assert.equal(winston.levels['debug'], 4);
      assert.equal(winston.levels['error'], 5);
      assert.equal(winston.levels['insane'], 6);
    }
  }
}).addBatch({
  "the removeLevel() method": {
    topic: function() {
      winston.setDefaultLevels('npm');
      return winston.removeLevel('warn');
    },
    "should remove the level": function() {
      assert.isUndefined(winston.levels['warn']);
    }, 
    "should remove the level log function": function() {
      assert.isUndefined(winston.warn);
    },
    "should increment the levels for the logger correctly": function() {
      assert.equal(winston.levels['silly'], 0);
      assert.equal(winston.levels['verbose'], 1);
      assert.equal(winston.levels['info'], 2);
      assert.equal(winston.levels['debug'], 3);
      assert.equal(winston.levels['error'], 4);

    }, 
    "should effect any logger created from this winston instance unless levels are specified": function() {
      var logger = new winston.Logger();
      assert.isUndefined(logger.warn);
    },
    "it should throw an error if level is not present": function() {
      assert.throws(function () { winston.removeLevel('fake') }, Error);
    }
  }
}).export(module);