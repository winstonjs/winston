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
    fs = require('fs'),
    assert = require('assert'),
    winston = require('winston'),
    helpers = require('./helpers');

var stream = fs.createWriteStream(path.join(__dirname, 'testfile.log')),
    fileTransport = new (winston.transports.File)({ filename: path.join(__dirname, 'testfilename.log') }),
    streamTransport = new (winston.transports.File)({ stream: stream });

vows.describe('winston/transports/console').addBatch({
  "An instance of the File Transport": {
    "when passed a valid filename": {
      "should have the proper methods defined": function () {
        helpers.assertFile(fileTransport);
      },
      "the log() method": helpers.testNpmLevels(fileTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    },
    "when passed a valid file stream": {
      "should have the proper methods defined": function () {
        helpers.assertFile(streamTransport);
      },
      "the log() method": helpers.testNpmLevels(streamTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    }
  }
}).export(module);