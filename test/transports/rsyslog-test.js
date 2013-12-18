/*
 * rsyslog-test.js: Tests for instances of the RSysLog transport
 *
 * (C) 2011 Fabio Grande
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    assert = require('assert'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers');

var rsyslogTransport = new (winston.transports.Rsyslog)({
  "host": "localhost",
  "port": 514,
  "path": "/winston-test"
});

vows.describe('winston/transports/rsyslog').addBatch({
  "An instance of the RSysLog Transport": {
    "when passed valid options": {
      "should have the proper methods defined": function () {
        helpers.assertRsyslog(rsyslogTransport);
      },
      "the log() method": helpers.testSyslogLevels(rsyslogTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    }
  }
}).export(module);

