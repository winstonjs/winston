/*
 * write-after-end.test.js: Tests for the "write after end" race condition fix.
 *
 * (C) 2024 Winston Contributors
 * MIT LICENSE
 *
 * This test verifies that calling logger.end() during heavy logging
 * does not cause "write after end" errors.
 *
 * See: https://github.com/winstonjs/winston/issues/2219
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const winston = require('../../../lib/winston');
const Transport = require('winston-transport');
const testLogFixturesPath = path.join(__dirname, 'fixtures', 'logs');

/**
 * A slow transport that simulates backpressure by delaying writes.
 * This forces the logger's readable buffer to back up, exercising
 * the event-driven drain path in _final().
 */
class SlowTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
    this.delay = opts.delay || 10;
    this.messages = [];
  }

  log(info, callback) {
    this.messages.push(info);
    // Simulate slow write with delay
    setTimeout(() => {
      callback();
    }, this.delay);
  }
}

describe('Logger', function () {
  describe('_final() readable buffer drain (issue #2219)', function () {
    const logFile = path.join(testLogFixturesPath, 'write-after-end-test.log');
    const logFile2 = path.join(testLogFixturesPath, 'write-after-end-test-2.log');

    beforeEach(function () {
      // Clean up test files if they exist
      [logFile, logFile2].forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
    });

    afterEach(function () {
      // Clean up test files
      [logFile, logFile2].forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
    });

    it('should not emit "write after end" error when ending during heavy logging', function (done) {
      const logger = winston.createLogger({
        transports: [
          new winston.transports.File({
            filename: logFile,
            level: 'debug'
          })
        ]
      });

      let writeAfterEndError = null;

      // Listen for errors on the transport
      logger.transports[0].on('error', (err) => {
        if (err && err.message && err.message.includes('write after end')) {
          writeAfterEndError = err;
        }
      });

      // Also listen on the logger itself
      logger.on('error', (err) => {
        if (err && err.message && err.message.includes('write after end')) {
          writeAfterEndError = err;
        }
      });

      // Write many log messages rapidly to fill the buffer
      for (let i = 0; i < 1000; i++) {
        logger.info(`Test message ${i} - padding to make message longer and fill buffer faster`);
      }

      // End the logger while messages might still be buffered
      logger.end();

      // Wait for finish event
      logger.on('finish', () => {
        // Give a moment for any async errors to surface
        setTimeout(() => {
          assert.strictEqual(writeAfterEndError, null, 'Should not have write after end error');
          done();
        }, 100);
      });
    }, 10000);

    it('should flush all messages when logger.end() is called immediately after logging', function (done) {
      const logger = winston.createLogger({
        transports: [
          new winston.transports.File({
            filename: logFile,
            level: 'debug'
          })
        ]
      });

      const messageCount = 100;

      // Write messages
      for (let i = 0; i < messageCount; i++) {
        logger.info(`Message ${i}`);
      }

      // End immediately
      logger.end();

      logger.on('finish', () => {
        // Read the file and count lines
        setTimeout(() => {
          const content = fs.readFileSync(logFile, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.length > 0);

          // All messages should be present
          assert.strictEqual(lines.length, messageCount, `Expected ${messageCount} messages but got ${lines.length}`);
          done();
        }, 100);
      });
    }, 10000);

    it('should wait for readable buffer to drain before ending transports', function (done) {
      const logger = winston.createLogger({
        transports: [
          new winston.transports.File({
            filename: logFile,
            level: 'debug'
          })
        ]
      });

      // Track the order of events
      let transportFinished = false;

      logger.transports[0].on('finish', () => {
        transportFinished = true;
      });

      logger.on('finish', () => {
        // Verify transport finished before logger
        assert.strictEqual(transportFinished, true, 'Transport should finish before logger');

        // Verify all messages were written
        setTimeout(() => {
          const content = fs.readFileSync(logFile, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.length > 0);
          assert.strictEqual(lines.length, 50, 'Expected 50 messages');
          done();
        }, 50);
      });

      // Write messages
      for (let i = 0; i < 50; i++) {
        logger.info(`Ordered message ${i}`);
      }

      logger.end();
    }, 10000);

    it('should handle multiple transports without write after end errors', function (done) {
      const logger = winston.createLogger({
        transports: [
          new winston.transports.File({
            filename: logFile,
            level: 'debug'
          }),
          new winston.transports.File({
            filename: logFile2,
            level: 'debug'
          })
        ]
      });

      let errorCount = 0;

      logger.transports.forEach(transport => {
        transport.on('error', (err) => {
          if (err && err.message && err.message.includes('write after end')) {
            errorCount++;
          }
        });
      });

      // Write messages
      for (let i = 0; i < 200; i++) {
        logger.info(`Multi-transport message ${i}`);
      }

      logger.end();

      logger.on('finish', () => {
        setTimeout(() => {
          assert.strictEqual(errorCount, 0, 'Should have no write after end errors');

          // Verify both files have content
          const content1 = fs.readFileSync(logFile, 'utf8');
          const content2 = fs.readFileSync(logFile2, 'utf8');
          const lines1 = content1.trim().split('\n').filter(line => line.length > 0);
          const lines2 = content2.trim().split('\n').filter(line => line.length > 0);

          assert.strictEqual(lines1.length, 200, 'First file should have 200 messages');
          assert.strictEqual(lines2.length, 200, 'Second file should have 200 messages');

          done();
        }, 100);
      });
    }, 10000);

    it('should handle end() being called with empty buffer', function (done) {
      const logger = winston.createLogger({
        transports: [
          new winston.transports.File({
            filename: logFile,
            level: 'debug'
          })
        ]
      });

      let errorOccurred = false;

      logger.on('error', () => {
        errorOccurred = true;
      });

      logger.transports[0].on('error', () => {
        errorOccurred = true;
      });

      // End without writing anything
      logger.end();

      logger.on('finish', () => {
        setTimeout(() => {
          assert.strictEqual(errorOccurred, false, 'Should not have any errors');
          done();
        }, 50);
      });
    }, 10000);

    it('should handle rapid successive log + end calls', function (done) {
      const logger = winston.createLogger({
        transports: [
          new winston.transports.File({
            filename: logFile,
            level: 'debug'
          })
        ]
      });

      let writeAfterEndError = null;

      logger.transports[0].on('error', (err) => {
        if (err && err.message && err.message.includes('write after end')) {
          writeAfterEndError = err;
        }
      });

      // Rapid fire log calls
      logger.info('message 1');
      logger.info('message 2');
      logger.info('message 3');
      logger.end();

      logger.on('finish', () => {
        setTimeout(() => {
          assert.strictEqual(writeAfterEndError, null, 'Should not have write after end error');

          const content = fs.readFileSync(logFile, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.length > 0);
          assert.strictEqual(lines.length, 3, 'Should have 3 messages');
          done();
        }, 100);
      });
    }, 10000);

    it('should handle Console + File transports mixed without errors', function (done) {
      const logger = winston.createLogger({
        transports: [
          new winston.transports.Console({ level: 'debug', silent: true }),
          new winston.transports.File({ filename: logFile, level: 'debug' })
        ]
      });

      let errorCount = 0;

      logger.transports.forEach(transport => {
        transport.on('error', (err) => {
          if (err && err.message && err.message.includes('write after end')) {
            errorCount++;
          }
        });
      });

      // Write messages
      for (let i = 0; i < 100; i++) {
        logger.info(`Mixed transport message ${i}`);
      }

      logger.end();

      logger.on('finish', () => {
        setTimeout(() => {
          assert.strictEqual(errorCount, 0, 'Should have no write after end errors');
          done();
        }, 100);
      });
    }, 10000);

    it('should drain readable buffer via data events with slow transport', function (done) {
      // This test exercises the event-driven drain path in _final() by using
      // a slow transport that causes the readable buffer to back up
      const slowTransport = new SlowTransport({ delay: 5 });

      const logger = winston.createLogger({
        transports: [slowTransport]
      });

      let writeAfterEndError = null;

      slowTransport.on('error', (err) => {
        if (err && err.message && err.message.includes('write after end')) {
          writeAfterEndError = err;
        }
      });

      // Write enough messages to ensure buffer backs up due to slow transport
      const messageCount = 50;
      for (let i = 0; i < messageCount; i++) {
        logger.info(`Slow transport message ${i}`);
      }

      // End immediately - buffer should have data due to slow transport
      logger.end();

      logger.on('finish', () => {
        // Verify no write after end errors
        assert.strictEqual(writeAfterEndError, null, 'Should not have write after end error');
        // Verify all messages were received by the transport
        assert.strictEqual(slowTransport.messages.length, messageCount,
          `Expected ${messageCount} messages but got ${slowTransport.messages.length}`);
        done();
      });
    }, 10000);

    it('should wait for buffer drain with backpressure from slow transport', function (done) {
      // Use a very slow transport to guarantee buffer backs up
      const slowTransport = new SlowTransport({ delay: 20 });

      const logger = winston.createLogger({
        transports: [slowTransport]
      });

      // Track if the logger's readable buffer had data when _final was called
      // We can infer this by checking that the transport received all messages
      const messageCount = 30;

      for (let i = 0; i < messageCount; i++) {
        logger.info(`Backpressure test message ${i}`);
      }

      // End while transport is still processing
      logger.end();

      logger.on('finish', () => {
        // All messages should eventually be delivered despite backpressure
        assert.strictEqual(slowTransport.messages.length, messageCount,
          'All messages should be delivered even with slow transport');
        done();
      });
    }, 15000);

    it('should handle mixed fast and slow transports', function (done) {
      const slowTransport = new SlowTransport({ delay: 15 });

      const logger = winston.createLogger({
        transports: [
          new winston.transports.File({ filename: logFile, level: 'debug' }),
          slowTransport
        ]
      });

      let errorCount = 0;

      logger.transports.forEach(transport => {
        transport.on('error', (err) => {
          if (err && err.message && err.message.includes('write after end')) {
            errorCount++;
          }
        });
      });

      const messageCount = 40;
      for (let i = 0; i < messageCount; i++) {
        logger.info(`Mixed speed transport message ${i}`);
      }

      logger.end();

      logger.on('finish', () => {
        setTimeout(() => {
          assert.strictEqual(errorCount, 0, 'Should have no write after end errors');
          // Verify both transports received all messages
          assert.strictEqual(slowTransport.messages.length, messageCount,
            'Slow transport should receive all messages');

          const content = fs.readFileSync(logFile, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.length > 0);
          assert.strictEqual(lines.length, messageCount, 'File should have all messages');

          done();
        }, 100);
      });
    }, 15000);
  });
});
