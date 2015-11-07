/*
 * common.test.js: Tests for lib/winston/common.js
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

vows.describe('winston/common').addBatch({
  "The winston module": {
    "the setLevels() method": {
      topic: function () {
        winston.setLevels(winston.config.syslog.levels);
        return null;
      },
      "should have the proper methods defined": function () {
        assert.isObject(winston.transports);
        assert.isFunction(winston.transports.Console);
        assert.isObject(winston.default.transports.console);
        assert.isFalse(winston.emitErrs);
        assert.isObject(winston.config);

        var newLevels = Object.keys(winston.config.syslog.levels);
        ['Logger', 'add', 'remove', 'extend', 'clear']
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
    },
    "the clone() method": {
      "with Error object": {
        topic: function () {
          var original = new Error("foo");
          original.name = "bar";

          var copy = winston.clone(original);

          return { original: original, copy: copy };
        },
        "should clone the value": function (result) {
          assert.notEqual(result.original, result.copy);
          assert.equal(result.original.message, result.copy.message);
          assert.equal(result.original.name, result.copy.name);
        }
      },
      "with Date object": {
        topic: function () {
          var original = new Date(1000);

          var copy = winston.clone(original);

          return { original: original, copy: copy };
        },
        "should clone the value": function (result) {
          assert.notEqual(result.original, result.copy);
          assert.equal(result.original.getTime(), result.copy.getTime());
        }
      }
    }
  }
}).export(module);
