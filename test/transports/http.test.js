/*
 * http-test.js: Tests for instances of the HTTP transport
 *
 * MIT LICENSE
 */

var path = require('path'),
    http = require('http'),
    fs = require('fs'),
    hock = require('hock'),
    assume = require('assume'),
    Http = require('../../lib/winston/transports/http'),
    helpers = require('../helpers');

var host = '127.0.0.1';

function mockHttpServer(opts, done) {
  if (!done && typeof opts === 'function') {
    done = opts;
    opts = {};
  }

  var mock = hock.createHock();
  opts.path = opts.path || 'log';
  opts.payload = opts.payload || {
    level: 'info',
    message: 'hello',
    meta: {}
  };

  mock
    .post('/' + opts.path, opts.payload)
    .min(1)
    .max(1)
    .reply(200);

  var server = http.createServer(mock.handler);
  server.listen(0, '0.0.0.0', done);
  return { server, mock };
}

describe('Http({ host, port, path })', function () {
  var context;
  var server;
  beforeEach(function (done) {
    context = mockHttpServer(done);
    server = context.server;
  });

  it('should send logs over HTTP', function (done) {
    var port = server.address().port;
    var httpTransport = new Http({
      host: host,
      port: port,
      path: 'log'
    }).on('error', function (err) {
      assume(err).falsy();
    }).on('logged', function () {
      context.mock.done(function (err) {
        if (err) { assume(err).falsy(); }
        done();
      });
    });

    httpTransport.log({
      level: 'info',
      message: 'hello',
      meta: {}
    }, function (err) {
      if (err) { assume(err).falsy(); }
    });
  });

  afterEach(function (done) {
    server.close(done.bind(null, null));
  });
});
