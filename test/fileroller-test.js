/*
 * file-test.js: Tests for instances of the File transport
 *
 * (C) 2010 Charlie Robbins
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

var fileTransport = new (winston.transports.Fileroller)({ filename: path.join(__dirname, 'testfileroller.log') });

vows.describe('winston/transports/fileroller').addBatch({
  "An instance of the File Transport": {
    "when passed a valid filename": {
      "should have the proper methods defined": function () {
        helpers.assertFileroller(fileTransport);
      },
      "the log() method": helpers.testNpmLevels(fileTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    }
  }
}).export(module);