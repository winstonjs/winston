'use strict';

/*
 * file-stress.test.js: Tests for stressing File transport: volume, ambient event loop lag.
 *
 * (C) 2016 Charlie Robbins
 * MIT LICENSE
 *
 */

const fs = require('fs');
const os  = require('os');
const path = require('path');
const assume = require('assume');
const helpers = require('../helpers');
const split = require('split2');
const winston = require('../../lib/winston');

describe('File (stress)', function () {
  this.timeout(30 * 1000);

  const logPath = path.resolve(__dirname, '../fixtures/logs/file-stress-test.log');
  beforeEach(function () {
    try {
      fs.unlinkSync(logPath);
    } catch (ex) {
      if (ex && ex.code !== 'ENOENT') { return done(ex); }
    }
  });

  it('should handle a high volume of writes', function (done) {
    const logger = winston.createLogger({
      transports: [new winston.transports.File({
        filename: logPath
      })]
    });

    const counters = {
      write: 0,
      read: 0
    };

    const interval = setInterval(function () {
      logger.info(++counters.write);
    }, 0);

    setTimeout(function () {
      clearInterval(interval);

      helpers.tryRead(logPath)
        .on('error', function (err) {
          assume(err).false();
          logger.close();
          done();
        })
        .pipe(split())
        .on('data', function (d) {
          const json = JSON.parse(d);
          assume(json.level).equal('info');
          assume(json.message).equal(++counters.read);
        })
        .on('end', function () {
          assume(counters.write).equal(counters.read);
          logger.close();
          done();
        });
    }, 10000);
  });

  it('should handle a high volume of large writes', function (done) {
    const logger = winston.createLogger({
      transports: [new winston.transports.File({
        filename: logPath
      })]
    });

    const counters = {
      write: 0,
      read: 0
    };

    const interval = setInterval(function () {
      const msg = {
        counter: ++counters.write,
        message: 'a'.repeat(16384 - os.EOL.length - 1)
      };
      logger.info(msg);
    }, 0);

    setTimeout(function () {
      clearInterval(interval);

      helpers.tryRead(logPath)
        .on('error', function (err) {
          assume(err).false();
          logger.close();
          done();
        })
        .pipe(split())
        .on('data', function (d) {
          const json = JSON.parse(d);
          assume(json.level).equal('info');
          assume(json.message).equal('a'.repeat(16384 - os.EOL.length - 1));
          assume(json.counter).equal(++counters.read);
        })
        .on('end', function () {
          assume(counters.write).equal(counters.read);
          logger.close();
          done();
        });
    }, 10000);
  });

  it('should handle a high volume of large writes synchronous', function (done) {
    const logger = winston.createLogger({
      transports: [new winston.transports.File({
        filename: logPath
      })]
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

    setTimeout(function () {
      helpers.tryRead(logPath)
        .on('error', function (err) {
          assume(err).false();
          logger.close();
          done();
        })
        .pipe(split())
        .on('data', function (d) {
          const json = JSON.parse(d);
          assume(json.level).equal('info');
          assume(json.message).equal('a'.repeat(16384 - os.EOL.length - 1));
          assume(json.counter).equal(++counters.read);
        })
        .on('end', function () {
          assume(counters.write).equal(counters.read);
          logger.close();
          done();
        });
    }, 10000);
  });
});
