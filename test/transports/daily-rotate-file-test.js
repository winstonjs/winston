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
    failedDailyRotateFileTransport = new (winston.transports.DailyRotateFile)({
      filename: path.join(__dirname, '..', 'fixtures', 'logs', 'dir404', 'testfile.log')
    }),
    streamTransport = new (winston.transports.DailyRotateFile)({ stream: stream });

var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhM])\1?/g;

function pad(val, len) {
  val = String(val);
  len = len || 2;
  while (val.length < len) { val = "0" + val; }
  return val;
};

function getFormattedDate(pattern, date) {
  var flags = {
    yy:   String(date.getFullYear()).slice(2),
    yyyy: date.getFullYear(),
    M:    date.getMonth() + 1,
    MM:   pad(date.getMonth() + 1),
    d:    date.getDate(),
    dd:   pad(date.getDate()),
    H:    date.getHours(),
    HH:   pad(date.getHours()),
    m:    date.getMinutes(),
    mm:   pad(date.getMinutes())
  };
  return pattern.replace(token, function ($0) {
    return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
  });
}

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
    "when passed an invalid filename": {
      "should have proper methods defined": function () {
        helpers.assertDailyRotateFile(failedDailyRotateFileTransport);
      },
      "should enter noop failed state": function () {
        helpers.assertFailedTransport(failedDailyRotateFileTransport);
      }
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
  })
}).addBatch({
  "An instance of the Daily Rotate File Transport": {
    "when the file currently pointing was removed and time has been passing": {
      topic: function() {
        var self = this;
        var minutely = new (winston.transports.DailyRotateFile)({
          filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log'),
          datePattern: '.yyyyMMddHHmm'
        });
        // log into the current file
        minutely.log('hello');
        var oldTimestamp = getFormattedDate('.yyyyMMddHHmm', new Date());
        setTimeout(function() {
          // remove the current file
          fs.unlinkSync(path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log' + oldTimestamp));
          setTimeout(function() {
            // wait for a minute and log something
            minutely.log('hello AGAIN');
            var newTimestamp = getFormattedDate('.yyyyMMddHHmm', new Date());
            setTimeout(function() {
              fs.stat(path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log' + newTimestamp), self.callback);
            }, 1000);
          }, (60 - new Date().getSeconds() + 1) * 1000);
        }, 3 * 1000);
      },
      "should be logged into the new file": function(err, stat) {
        // see if the file with new timestamp exists
        assert.isNull(err);
        assert.isNotNull(stat);
        assert.isDefined(stat);
        assert.isTrue(stat.size > 0);
      }
    }
  }
}).export(module);
