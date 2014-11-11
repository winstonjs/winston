/*
 * http-test.js: Tests for instances of the HTTP transport
 *
 * MIT LICENSE
 */

var path = require('path'),
    vows = require('vows'),
    http = require('http'),
    fs = require('fs'),
    assert = require('assert'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers'),
    hock = require('hock');

var transport = require('./transport');

// TODO way of doing describe.only in vows?
// TODO How to debug a test?
// TODO Coverage tool

var host = '127.0.0.1';
var port = 1337;


vows.describe('winston/transports/http').addBatch({
  "When the HTTP endpoint": {
    topic: function () {
      var mock = this.mock = hock.createHock(),
          self = this;

        mock
          .post('/log', {
            "method":"collect",
            "params":{
              "level":"info",
              "message":"hello",
              "meta":{}
            }
          })
          .min(1)
          .max(1)
          .reply(200);

      var server = this.server = http.createServer(mock.handler);
      server.listen(port, '0.0.0.0', this.callback);
    },
    "is running": function (err) {
      assert.ifError(err);
    },
    "an instance of the Http transport": {
      topic: function () {
        var self = this,
            httpTransport = new (winston.transports.Http)({
              host: host,
              port: port,
              path: 'log'
            });

        httpTransport.log('info', 'hello', function (logErr, logged) {
          self.mock.done(function (doneErr) {
            self.callback(null, logErr, logged, doneErr);
          })
        });
      },
      "should log to the specified URL": function (_, err, logged, requested) {
        assert.ifError(err);
        assert.isTrue(logged);
        assert.ifError(requested);
        this.server.close();
      }
    }
  }
}).export(module);
