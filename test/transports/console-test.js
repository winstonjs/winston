/*
 * console-test.js: Tests for instances of the Console transport
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers'),
    stdMocks = require('std-mocks');

var npmTransport = new (winston.transports.Console)(),
    syslogTransport = new (winston.transports.Console)({ levels: winston.config.syslog.levels });

vows.describe('winston/transports/console').addBatch({
  "An instance of the Console Transport": {
    "with showLevel on": {
      topic : function() {
        npmTransport.showLevel = true;
        stdMocks.use();
        npmTransport.log('info', '');
      },
      "should have level prepended": function () {
        stdMocks.restore();
        var output = stdMocks.flush(),
            line   = output.stdout[0];

        assert.equal(line, 'info: \n');
      }
    },
    "with showLevel off": {
      topic : function() {
        npmTransport.showLevel = false;
        stdMocks.use();
        npmTransport.log('info', '');
      },
      "should not have level prepended": function () {
        stdMocks.restore();
        var output = stdMocks.flush(),
            line   = output.stdout[0];

        assert.equal(line, undefined);
      }
    },
    "with npm levels": {
      "should have the proper methods defined": function () {
        helpers.assertConsole(npmTransport);
      },
      "the log() method": helpers.testNpmLevels(npmTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    },
    "with syslog levels": {
      "should have the proper methods defined": function () {
        helpers.assertConsole(syslogTransport);
      },
      "the log() method": helpers.testSyslogLevels(syslogTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    }
  }
}).export(module);