'use strict';

/*
 * tail-file.test.js: Tests for lib/winston/tail-file.js
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const fs = require('fs');
const path = require('path');
const winston = require('../lib/winston');
const { Stream } = require('stream');
const tailFile = require('../lib/winston/tail-file');

//
// Test helper that performs writes to a specific log file
// on a given interval
//
function logOnInterval({
  filename,
  interval = 100,
  timeout = (10 * 1000),
  message = '',
  open
}, done) {
  // const filename = opts.file;
  // const interval = opts.interval || 100;
  // const timeout = opts.timeout || 10 * 1000;
  // const message = opts.message || '';
  // const open = opts.open;

  const transport = new winston.transports.File({ filename });
  const logger = winston.createLogger({ transports: [transport] });

  if (open) {
    transport.once('open', open);
  }

  const counters = {
    write: 0,
    read: 0
  };

  fs.unlink(filename, () => {
    const intervalId = setInterval(() => {
      logger.info({ message: ++counters.write + message });
    }, interval);

    setTimeout(() => {
      //
      // Clear the interval to stop writes, then pause
      // briefly to let any listening streams flush.
      //
      clearInterval(intervalId);
      setTimeout(done.bind(null, null, counters), 100);
    }, timeout);
  });
}


describe('tailFile', function () {
  this.timeout(10 * 1000);

  it('is a function', () => {
    assume(tailFile).is.a('function');
    assume(tailFile.length).equals(2);
  });

  it('returns a stream that emits "line" for every line', done => {
    const tailable = path.join(__dirname, 'fixtures', 'logs', 'common-tail-file.log');
    let expected = 0;

    //
    // Performs the actual tail and asserts it.
    //
    function startTailFile() {
      const stream = tailFile({ file: tailable });
      assume(stream).instanceof(Stream);

      stream.on('line', buff => {
        expected += 1;
        assume(JSON.parse('' + buff)).is.an('object');
      });
    }

    logOnInterval({
      filename: tailable,
      open: startTailFile,
      timeout: 5000
    }, (err, actual) => {
      if (err) {
        return done(err);
      }

      assume(expected).equals(actual.write);
      done();
    });
  });
});
