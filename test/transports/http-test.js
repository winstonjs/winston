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
  "A valid instance of the HTTP Transport": {
    topic: new (winston.transports.Http)({
      host: host,
      port: port,
      path: 'log'
    }),
    "log method": {
      // "when called with (undefined)": {
      //   topic: function (httpTransport) {
      //     var self = this;
      //     var scope = hock('http://foo')
      //     .post('log', {
      //       "method":"collect",
      //       "params":{
      //         "level":"info",
      //         "message":"hello",
      //         "meta":{}
      //       }
      //     })
      //     .reply(200);

      //     httpTr
      //   }
      // },
      "when logging in 'info' the string 'hello'": {
        topic: function (httpTransport) {
          var self = this;

          var mock = hock.createHock();

          mock
          .post('log', {
            "method":"collect",
            "params":{
              "level":"info",
              "message":"hello",
              "meta":{}
            }
          })
          .reply(200);

          var server = http.createServer(mock.handler);

          server.listen(port, function (err) {
            assert.ifError(err);
            httpTransport.log('info', 'hello', function (err) {
              assert.ifError(err);
              self.callback(null, mock);
            });
          });
        },
        "should log to the specified URL": function (err, scope) {
          assert.ifError(err);
          scope.done();
          hock.cleanAll();
        }
      }
    }
  }
}).export(module);
