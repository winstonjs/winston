/*
 * couchdb-test.js: Tests for instances of the Couchdb transport
 *
 * (C) 2011 Max Ogden
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    fs = require('fs'),
    http = require('http'),
    assert = require('assert'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers'),
    request = require('request');

var transport = require('./transport');

request('http://localhost:5984/logs', function(err, res) {
  if (!err && res.statusCode !== 404) test();
});

function test() {
  var couchdbTransport = new winston.transports.Couchdb({
    host: 'localhost',
    port: 5984,
    db: 'logs'
  });

  vows.describe('winston/transports/couchdb').addBatch({
    "An instance of the Couchdb Transport": {
      "when passed valid options": {
        "should have the proper methods defined": function () {
          helpers.assertCouchdb(couchdbTransport);
        },
        "the log() method": helpers.testNpmLevels(couchdbTransport, "should respond with true", function (ign, err, logged) {
          assert.isNull(err);
          assert.isTrue(logged);
        })
      }
    }
  }).addBatch({
  /*
    "The winston logger": {
      topic: new winston.Logger({
        transports: [
          new winston.transports.Couchdb({
            host: 'localhost',
            port: 5984,
            db: 'logs'
          })
        ]
      }),
      "the query() method": {
        topic: function(logger) {
          var cb = this.callback;
          logger.log('info', 'hello world', {}, function() {
            logger.query({}, cb);
          });
        },
        "should return matching results": function (err, results, logger) {
          results = results.Couchdb || results.couchdb;
          assert.equal(results.pop().message.indexOf('hello world'), 0);
        }
      },
      "the stream() method": {
        topic: function(logger) {
          var cb = this.callback;
          var j = 10;
          var i = 10;
          var results = [];

          logger.log('info', 'hello world', {});

          var stream = logger.stream({});
          stream.on('log', function(log) {
            results.push(log);
            results.stream = stream;
            if (!--j) cb(results);
          });

          while (i--) logger.log('info', 'hello world ' + i, {});
        },
        "should stream logs": function (results, logger) {
          results.forEach(function(log) {
            assert.ok(log.message.indexOf('hello world') === 0
                      || log.message.indexOf('test message') === 0);
          });
          results.stream.destroy();
        }
      }
    }
    */
  }).export(module);
}
