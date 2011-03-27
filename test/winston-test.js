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
      //assert.isFunction(winston.transports.Riak);
      assert.isObject(winston.defaultTransports().console);
      assert.isFalse(winston.emitErrs);
      assert.isObject(winston.config);
      ['Logger', 'defaultTransports', 'add', 'remove', 'extend']
        .concat(Object.keys(winston.config.npm.levels))
        .forEach(function (key) {
          assert.isFunction(winston[key]);
        });
    },
    "the log() method": helpers.testNpmLevels(winston, "should respond without an error", function (err) {
      assert.isNull(err);
    }),
    "the extend() method called on an empty object": {
      topic: function (logger) {
        var empty = {};
        winston.extend(empty);
        return empty;
      },
      "should define the appropriate methods": function (extended) {
        ['log', 'profile'].concat(Object.keys(winston.config.npm.levels)).forEach(function (method) {
          assert.isFunction(extended[method]);
        });
      }
    }
  }
}).addBatch({
  "The winston module": {
    "the setLevels() method": {
      topic: function () {
        winston.setLevels(winston.config.syslog.levels);
        return null;
      },
      "should have the proper methods defined": function () {
        assert.isObject(winston.transports);
        assert.isFunction(winston.transports.Console);
        assert.isFunction(winston.transports.Loggly);
        //assert.isFunction(winston.transports.Riak);
        assert.isObject(winston.defaultTransports().console);
        assert.isFalse(winston.emitErrs);
        assert.isObject(winston.config);
        
        var newLevels = Object.keys(winston.config.syslog.levels);
        ['Logger', 'defaultTransports', 'add', 'remove', 'extend']
          .concat(newLevels)
          .forEach(function (key) {
            assert.isFunction(winston[key]);
          });
        
        
        Object.keys(winston.config.npm.levels)
          .filter(function (key) {
            return newLevels.indexOf(key) === -1;
          })
          .forEach(function (key) {
            assert.isTrue(typeof winston[key] === 'undefined');
          });
      }
    }
  }
}).export(module);