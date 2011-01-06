/*
 * loggly-test.js: Tests for instances of the Loggly transport
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
    
var config = helpers.loadConfig(),
    transport = new (winston.transports.Loggly)(config.transports.loggly);

vows.describe('winston/transports/loggly').addBatch({
  "An instance of the Loggly Transport": {
    "should have the proper methods defined": function () {
      helpers.assertLoggly(transport);
    },
    "the log() method": helpers.testLevels(transport, "should log messages to loggly", function (err, result) {
      assert.isNull(err);
      assert.isObject(result);
      assert.equal(result.response, 'ok');
    })
  }
}).export(module);