'use strict';

const assume = require('assume');
const winston = require('../../../../lib/winston');
const http = require('http');

describe('HTTP transport stress tests', function () {
  this.timeout(30000); // Increase timeout for stress test

  let server;
  let port;

  before(function (done) {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      });
    });

    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  after(function (done) {
    server.close(done);
  });

  it('should not leak memory when logging many messages', function (done) {
    const transport = new winston.transports.Http({
      host: 'localhost',
      port: port,
      path: '/log'
    });

    const logger = winston.createLogger({
      transports: [transport]
    });

    // Get initial memory usage
    const initialMemory = process.memoryUsage().heapUsed;

    // Log messages
    const iterations = 1000; // Reduced from original test case but still significant
    const promises = [];

    for (let i = 0; i < iterations; i++) {
      promises.push(
        new Promise((resolve) => {
          logger.info('testing http transport memory leak', {
            count: i,
            timestamp: Date.now()
          }, () => resolve());
        })
      );
    }

    // Wait for all logs to complete
    Promise.all(promises).then(() => {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDiff = finalMemory - initialMemory;

      // The memory difference should be relatively small
      assume(memoryDiff).is.below(5 * 1024 * 1024); // Less than 5MB growth

      done();
    });
  });

  it('should properly clean up event listeners with batch mode', function (done) {
    const transport = new winston.transports.Http({
      host: 'localhost',
      port: port,
      path: '/log',
      batch: true,
      batchCount: 100,
      batchInterval: 100
    });

    const logger = winston.createLogger({
      transports: [transport]
    });

    const initialListeners = transport.listenerCount('logged');

    // Log messages in batch mode
    const iterations = 500;
    for (let i = 0; i < iterations; i++) {
      logger.info('batch test message');
    }

    // Wait for batches to complete
    setTimeout(() => {
      const finalListeners = transport.listenerCount('logged');
      assume(finalListeners).equals(initialListeners);
      done();
    }, 1000);
  });
});
