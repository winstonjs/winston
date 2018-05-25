'use strict';

/*
 * file-stress.test.js: Tests for stressing File transport: volume, ambient event loop lag.
 *
 * (C) 2016 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const fs = require('fs');
const helpers = require('../helpers');
const path = require('path');
const os  = require('os');
const split = require('split2');
const winston = require('../../lib/winston');

describe('File (stress)', function () {
  this.timeout(30 * 1000);

  const logPath = path.resolve(__dirname, '../fixtures/logs/file-stress-test.log');
  beforeEach(done => {
    try {
      fs.unlinkSync(logPath); // eslint-disable-line no-sync
    } catch (ex) {
      if (ex && ex.code !== 'ENOENT') {
        return done(ex);
      }

    }

    return done();
  });

  it('should handle a high volume of writes', done => {
    const logger = winston.createLogger({
      transports: [
        new winston.transports.File({
          filename: logPath
        })
      ]
    });

    const counters = {
      write: 0,
      read: 0
    };

    const interval = setInterval(() => {
      logger.info(++counters.write);
    }, 0);

    setTimeout(() => {
      clearInterval(interval);

      helpers.tryRead(logPath)
        .on('error', err => {
          assume(err).false();
          logger.close();
          done();
        })
        .pipe(split())
        .on('data', d => {
          const json = JSON.parse(d);
          assume(json.level).equal('info');
          assume(json.message).equal(++counters.read);
        })
        .on('end', () => {
          assume(counters.write).equal(counters.read);
          logger.close();
          done();
        });
    }, 10000);
  });

  it('should handle a high volume of large writes', done => {
    const logger = winston.createLogger({
      transports: [
        new winston.transports.File({
          filename: logPath
        })
      ]
    });

    const counters = {
      write: 0,
      read: 0
    };

    const interval = setInterval(() => {
      const msg = {
        counter: ++counters.write,
        message: 'a'.repeat(16384 - os.EOL.length - 1)
      };
      logger.info(msg);
    }, 0);

    setTimeout(() => {
      clearInterval(interval);

      helpers.tryRead(logPath)
        .on('error', err => {
          assume(err).false();
          logger.close();
          done();
        })
        .pipe(split())
        .on('data', d => {
          const json = JSON.parse(d);
          assume(json.level).equal('info');
          assume(json.message).equal('a'.repeat(16384 - os.EOL.length - 1));
          assume(json.counter).equal(++counters.read);
        })
        .on('end', () => {
          assume(counters.write).equal(counters.read);
          logger.close();
          done();
        });
    }, 10000);
  });

  it('should handle a high volume of large writes synchronous', done => {
    const logger = winston.createLogger({
      transports: [
        new winston.transports.File({
          filename: logPath
        })
      ]
    });

    const counters = {
      write: 0,
      read: 0
    };

    const msgs = new Array(10).fill().map(() => ({
      counter: ++counters.write,
      message: 'a'.repeat(16384 - os.EOL.length - 1)
    }));
    msgs.forEach(msg => logger.info(msg));

    setTimeout(() => {
      helpers.tryRead(logPath)
        .on('error', err => {
          assume(err).false();
          logger.close();
          done();
        })
        .pipe(split())
        .on('data', d => {
          const json = JSON.parse(d);
          assume(json.level).equal('info');
          assume(json.message).equal('a'.repeat(16384 - os.EOL.length - 1));
          assume(json.counter).equal(++counters.read);
        })
        .on('end', () => {
          assume(counters.write).equal(counters.read);
          logger.close();
          done();
        });
    }, 10000);
  });
});
