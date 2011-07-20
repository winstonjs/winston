/*
 * loggly-test.js: Tests for instances of the Loggly transport
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('../lib/winston'),
    helpers = require('./helpers');

var config = helpers.loadConfig(),
    tokenTransport = new (winston.transports.Loggly)({ 
      subdomain: config.transports.loggly.subdomain,
      inputToken: config.transports.loggly.inputToken
    }),
    nameTransport = new (winston.transports.Loggly)({ 
      subdomain: config.transports.loggly.subdomain,
      inputName: config.transports.loggly.inputName,
      auth: config.transports.loggly.auth
    });

vows.describe('winston/transports/loggly').addBatch({
  "An instance of the Loggly Transport": {
    "when passed an input token": {
      "should have the proper methods defined": function () {
        helpers.assertLoggly(tokenTransport);
      },
      "the log() method": helpers.testNpmLevels(tokenTransport, "should log messages to loggly", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    },
    "when passed an input name": {
      "should have the proper methods defined": function () {
        helpers.assertLoggly(nameTransport);
      },
      "the log() method": helpers.testNpmLevels(nameTransport, "should log messages to loggly", function (ign, err, result) {
        assert.isNull(err);
        assert.isTrue(result === true || result.response === 'ok');
      })
    }
  }
}).export(module);