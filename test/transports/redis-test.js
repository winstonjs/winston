/*
 * redis-test.js: Tests for instances of the Redis transport
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
    helpers = require('../helpers');

var redisTransport = new (winston.transports.Redis)({ 
  "host": "localhost",
  "port": 6379,
  "db": "winston-log"
});

var server = http.createServer(function (req, res) {
  res.end();
});

server.listen(1337);

vows.describe('winston/transports/redis').addBatch({
  "An instance of the Redis Transport": {
    "when passed valid options": {
      "should have the proper methods defined": function () {
        helpers.assertRedis(redisTransport);
      },
      "the log() method": helpers.testNpmLevels(redisTransport, "should respond with true", function (ign, err, logged) {
        assert.isNull(err);
        assert.isTrue(logged);
      })
    }
  }
}).addBatch({
  "When the tests are over": {
    "the server should cleanup": function () {
      server.close();
    }
  }
}).export(module); 