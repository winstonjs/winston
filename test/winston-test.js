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
      
      ['Logger', 'defaultTransports', 'add', 'remove']
        .concat(Object.keys(winston.Logger.prototype.levels))
        .forEach(function (m) {
          assert.isFunction(winston[m]);
        });
    },
    "the log() method": helpers.testLevels(winston, "should respond without an error", function (err) {
      assert.isNull(err);
    })
  }
}).export(module);