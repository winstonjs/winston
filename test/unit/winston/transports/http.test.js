/*
 * http-test.js: Tests for instances of the HTTP transport
 *
 * MIT LICENSE
 */

const http = require('http');
const hock = require('hock');
const assume = require('assume');
const Http = require('../../../../lib/winston/transports/http');
const stringifyJson = require('safe-stable-stringify');

const host = '127.0.0.1';
const port = 0;

function mockHttpServer(done, expectedLog) {

  const mock = hock.createHock();
  const opts = {
    path: 'log',
    payload: expectedLog
  };

  mock
    .post('/' + opts.path, opts.payload)
    .min(1)
    .max(1)
    .reply(200);

  var server = http.createServer(mock.handler);
  server.listen(port, '0.0.0.0', done);
  return { server, mock };
}

function assumeError(err) {
  if (err) {
    assume(err).falsy();
  }
}

function onLogged(context, done) {
  context.mock.done(function (err) {
    assumeError(err);
    done();
  });
}

describe('Http({ host, port, path })', function () {
  let context;
  let server;
  const dummyLog = {
    level: 'info',
    message: 'hello',
    meta: {}
  };

  afterEach(function (done) {
    server.close(done.bind(null, null));
  });

  describe('nominal', function () {

    beforeEach(function (done) {
      context = mockHttpServer(done, dummyLog);
      server = context.server;
    });

    it('should send logs over HTTP', function (done) {
      const httpTransport = new Http({
        host: host,
        port: server.address().port,
        path: 'log'
      }).on('error', assumeError).on('logged', function () {
        onLogged(context, done);
      });
      httpTransport.log(dummyLog, assumeError);
    });

  });

  describe('bacth mode: max message', function () {

    beforeEach(function (done) {
      context = mockHttpServer(done, [dummyLog, dummyLog, dummyLog, dummyLog, dummyLog]);
      server = context.server;
    });

    it('test max message reached', function (done) {
      const httpTransport = new Http({
        host: host,
        port: server.address().port,
        path: 'log',
        batch: true,
        batchCount: 5
      })
        .on('error', assumeError)
        .on('logged', function () {
          onLogged(context, done);
        });

      httpTransport.log(dummyLog, assumeError);
      httpTransport.log(dummyLog, assumeError);
      httpTransport.log(dummyLog, assumeError);
      httpTransport.log(dummyLog, assumeError);
      httpTransport.log(dummyLog, assumeError);
    });

  });

  describe('bacth mode: timeout', function () {

    beforeEach(function (done) {
      context = mockHttpServer(done, [dummyLog, dummyLog]);
      server = context.server;
    });

    it('test timeout reached', function (done) {
      this.timeout(5000);
      const httpTransport = new Http({
        host: host,
        port: server.address().port,
        path: 'log',
        batch: true,
        batchCount: 5,
        batchInterval: 2000
      })
        .on('error', assumeError)
        .on('logged', function () {
          onLogged(context, done);
        });

      httpTransport.log(dummyLog, assumeError);
      httpTransport.log(dummyLog, assumeError);
    });

  });

  describe('circular structure', function () {
    const circularLog = {
      level: 'error',
      message: 'hello',
      meta: {}
    };

    circularLog.self = circularLog;

    beforeEach(function (done) {
      context = mockHttpServer(done, stringifyJson(circularLog));
      server = context.server;
    });

    it('should be able to handle options with circular structure', function (done) {
      const httpTransport = new Http({
        host: host,
        port: server.address().port,
        path: 'log'
      })
        .on('error', assumeError)
        .on('logged', function () {
          onLogged(context, done);
        });

      httpTransport.log(circularLog, assumeError);
    });
  });
});
