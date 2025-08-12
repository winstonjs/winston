'use strict';

const assume = require('assume');
const winston = require('../../../../lib/winston');
const { MESSAGE } = require('triple-beam');

describe('Console transport stress tests', function () {
  this.timeout(30000); // Increase timeout for stress test

  it('should not leak memory when logging many messages', function (done) {
    // Create logger with console transport
    const logger = winston.createLogger({
      transports: [new winston.transports.Console()]
    });

    // Get initial memory usage
    const initialMemory = process.memoryUsage().heapUsed;

    // Log messages
    const iterations = 100000;
    for (let i = 0; i < iterations; i++) {
      logger.info('testing memory leak');
    }

    // Wait for all setImmediate callbacks to complete
    setTimeout(() => {
      // Force garbage collection if node is run with --expose-gc
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDiff = finalMemory - initialMemory;

      // The memory difference should be relatively small
      // A few MB is acceptable for 100k messages
      assume(memoryDiff).is.below(5 * 1024 * 1024); // Less than 5MB growth

      done();
    }, 1000);
  });

  it('should properly clean up event listeners', function (done) {
    const transport = new winston.transports.Console();
    const initialListeners = transport.listenerCount('logged');

    // Log some messages
    for (let i = 0; i < 1000; i++) {
      transport.log({
        [MESSAGE]: 'test message',
        level: 'info'
      });
    }

    // Check listeners after a delay
    setTimeout(() => {
      const finalListeners = transport.listenerCount('logged');
      assume(finalListeners).equals(initialListeners);
      done();
    }, 500);
  });
});
