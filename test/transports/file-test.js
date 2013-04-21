/*
 * file-test.js: Tests for instances of the File transport
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

var ts = function(stamp) {
        if(stamp) return parseInt(stamp.substr(1, stamp.length-1), 10);
        return "!" + (new Date().getTime()) + "<";
      };

var stream = fs.createWriteStream(
      path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log')
    ),
    fileTransport = new (winston.transports.File)({
      filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfilename.log')
    }),
    streamTransport = new (winston.transports.File)({ stream: stream }),
    nonJsonFileTransport = new (winston.transports.File)({
      filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfilename_nojson.log'),
      json: false
    }),
    customTimeFileTransport = new (winston.transports.File)({
      filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfilename_customtime.log'),
      timestamp: ts
    });

vows.describe('winston/transports/file').addBatch({
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
    },
    "when in non-JSON mode": {
      'after the logs have flushed': {
        topic: function () {
          setTimeout(this.callback, 1000);
        },
        'the query() method': {
          'using basic querying': {
            'topic': function () {
              if (!nonJsonFileTransport.query) return;
              var cb = this.callback;
              nonJsonFileTransport.log('info', 'hello world', {}, function () {
                nonJsonFileTransport.query(cb);
              });
            },
            'should return matching results': function (err, results) {
              if (!nonJsonFileTransport.query) return;
              assert.isNull(err);
              var log = results.pop();
              assert.ok(log.split("info: ")[1].indexOf('hello world') === 0);
            }
          }
        }
      }
    },
    "with a custom timestamp function": {
      'after the logs have flushed': {
        topic: function () {
          setTimeout(this.callback, 1000);
        },
        'the query() method': {
          'with a start time': {
            'topic': function () {
              if (!customTimeFileTransport.query) return;
              var cb = this.callback;
              var now = new Date();
              customTimeFileTransport.log('info', 'hello world', {}, function () {
                customTimeFileTransport.query({from : now }, cb);
              });
            },
            'should return matching results': function (err, results) {
              if (!customTimeFileTransport.query) return;
              assert.isNull(err);
              assert.ok(results.length == 1);
            }
          }
        }
      }
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
  "An instance of the File Transport": transport(winston.transports.File, {
    filename: path.join(__dirname, '..', 'fixtures', 'logs', 'testfile.log')
  })
}).export(module);
