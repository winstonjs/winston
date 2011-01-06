/*
 * console-test.js: Tests for instances of the Console transport
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

var transport = new (winston.transports.Console)();

vows.describe('winston/transports/console').addBatch({
  "An instance of the Console Transport": {
    "should have the proper methods defined": function () {
      helpers.assertConsole(transport);
    },
    "the log() method": helpers.testLevels(transport, "should respond with true", function (err, logged) {
      assert.isNull(err);
      assert.isTrue(logged);
    })
  }
}).export(module);