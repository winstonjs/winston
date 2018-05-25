/*
 * http-test.js: Tests for instances of the HTTP transport
 *
 * MIT LICENSE
 */

const assume = require('assume');
const hock = require('hock');
const http = require('http');
const Http = require('../../lib/winston/transports/http');

const host = '127.0.0.1';

function mockHttpServer(opts, done) {
  if (!done && typeof opts === 'function') {
    done = opts;
    opts = {};
  }

  const mock = hock.createHock();
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

  const server = http.createServer(mock.handler);
  server.listen(0, '0.0.0.0', done);
  return { server, mock };
}

describe('Http({ host, port, path })', () => {
  let context;
  let server;

  beforeEach(done => {
    context = mockHttpServer(done);
    server = context.server;
  });

  it('should send logs over HTTP', done => {
    const port = server.address().port;
    const httpTransport = new Http({
      host,
      port,
      path: 'log'
    }).on('error', err => {
      assume(err).falsy();
    }).on('logged', () => {
      context.mock.done(err => {
        if (err) {
          assume(err).falsy();
        }

        done();
      });
    });

    httpTransport.log({
      level: 'info',
      message: 'hello',
      meta: {}
    }, err => {
      if (err) {
        assume(err).falsy();
      }
    });
  });

  afterEach(done => {
    server.close(done);
  });
});
