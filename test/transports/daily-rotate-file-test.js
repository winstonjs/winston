/*
 * file-test.js: Tests for instances of the Daily Rotate File transport
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    fs = require('fs'),
    assert = require('assert'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers');

var transport = require('./transport');

var stream = fs.createWriteStream(
      path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log.2012-12-18')
    ),
    dailyRotateFileTransport = new (winston.transports.DailyRotateFile)({
      filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfilename.log'),
      datePattern: '.yyyy-MM-dd'
    }),
    streamTransport = new (winston.transports.DailyRotateFile)({ stream: stream });

var streamPrepended = fs.createWriteStream(
      path.join(__dirname, '..', 'fixtures', 'logs', '2015-03-21_testfile.log')
    ), 
    dailyRotateFileTransportPrepended = new (winston.transports.DailyRotateFile)({
      filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfilename.log'), 
      datePattern: 'yyyy-MM-dd_', 
      prepend: true
    }), 
    streamTransportPrepended = new (winston.transports.DailyRotateFile)({ stream: streamPrepended });

vows.describe('winston/transports/daily-rotate-file').addBatch({
  "An instance of the Daily Rotate File Transport": {
    "when passed a valid filename": {
      "should have the proper methods defined": function () {
        helpers.assertDailyRotateFile(dailyRotateFileTransport);
      },
      "the log() method": helpers.testNpmLevels(dailyRotateFileTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    },
    "when passed a valid file stream": {
      "should have the proper methods defined": function () {
        helpers.assertDailyRotateFile(streamTransport);
      },
      "the log() method": helpers.testNpmLevels(streamTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    }
  }, 
  "An instance of the Daily Rotate File Transport with 'prepend' option": {
    "when passed a valid filename": {
      "the log() method": helpers.testNpmLevels(dailyRotateFileTransportPrepended, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    }, 
    "when passed a valid file stream": {
      "the log() method": helpers.testNpmLevels(streamTransportPrepended, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    }
  }
}).addBatch({
  "These tests have a non-deterministic end": {
    topic: function () {
      setTimeout(this.callback, 200);
    },
    "and this should be fixed before releasing": function () {
      assert.isTrue(true);
    }
  }
}).addBatch({
  "An instance of the Daily Rotate File Transport": transport(winston.transports.DailyRotateFile, {
    filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log'),
    datePattern: '.2012-12-18'
  }), 
  "An instance of the Daily Rotate File Transport with 'prepend' option": transport(winston.transports.DailyRotateFile, {
    filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log'), 
    datePattern: '2015-03-21_', 
    prepend: true
  })
}).export(module);
