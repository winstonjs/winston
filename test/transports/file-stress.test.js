'use strict';

/*
 * file-stress.test.js: Tests for stressing File transport: volume, ambient event loop lag.
 *
 * (C) 2016 Charlie Robbins
 * MIT LICENSE
 *
 */

var fs = require('fs'),
    os  = require('os'),
    path = require('path'),
    assume = require('assume'),
    helpers = require('../helpers'),
    split = require('split2'),
    winston = require('../../lib/winston');

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

    let counters = {
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
          done();
        });
    }, 10000);
  });
});
