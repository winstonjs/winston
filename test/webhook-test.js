/*
 * webhook-test.js: Tests for instances of the Webhook transport
 *
 * (C) 2011 Marak Squires
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var path = require('path'),
    vows = require('vows'),
    fs = require('fs'),
    assert = require('assert'),
    winston = require('winston'),
    helpers = require('./helpers');

console.log(winston.transports.Webhook);

var webhookTransport = new (winston.transports.Webhook)({ 
  "host": "localhost",
  "port": 8080,
  "path": "/winston-test"
});

vows.describe('winston/transports/webhook').addBatch({
  "An instance of the Webhook Transport": {
    "when passed valid options": {
      "should have the proper methods defined": function () {
        helpers.assertWebhook(webhookTransport);
      },
      "the log() method": helpers.testNpmLevels(webhookTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    }
  }
}).export(module);