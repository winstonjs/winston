'use strict';

const winston = require('../lib/winston');
const http = require('http');

// Create a simple HTTP server to receive logs
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end('{"ok":true}');
});

server.listen(3000, () => {
  console.log('Log server listening on port 3000');

  // Create logger with HTTP transport
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Http({
        host: 'localhost',
        port: 3000,
        path: '/log'
      })
    ]
  });

  console.log('Starting memory leak test...');
  console.log('Initial memory usage:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');

  // Log messages with metadata (similar to the reported issue)
  for (let i = 0; i < 100000; i++) {
    logger.info('testing http transport memory leak', {
      count: i,
      timestamp: Date.now(),
      metadata: {
        source: 'test',
        type: 'memory-test'
      }
    });

    // Log memory usage every 10k messages
    if (i % 10000 === 0) {
      console.log('Memory usage after', i, 'messages:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
    }
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  console.log('Final memory usage:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');

  // Close the server and exit
  server.close(() => process.exit(0));
});
