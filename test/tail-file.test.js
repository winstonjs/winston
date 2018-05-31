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
const tailFile = require('../lib/winston/tail-file');
const { Stream } = require('readable-stream');

//
// Test helper that performs writes to a specific log file
// on a given interval
//
function logOnInterval(opts, done) {
  var filename = opts.file;
  var interval = opts.interval || 100;
  var timeout = opts.timeout || 10 * 1000;
  var message = opts.message || '';
  var open = opts.open;
  var transport = new winston.transports.File({ filename: filename });
  var logger = winston.createLogger({ transports: [transport] });

  if (open) {
    transport.once('open', open);
  }

  let counters = {
    write: 0,
    read: 0
  };

  fs.unlink(filename, function () {
    const intervalId = setInterval(function () {
      logger.info({ message: ++counters.write + message });
    }, interval);

    setTimeout(function () {
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
  it('is a function', function () {
    assume(tailFile).is.a('function');
    assume(tailFile.length).equals(2);
  });

  it('returns a stream that emits "line" for every line', function (done) {
    var tailable = path.join(__dirname, 'fixtures', 'logs', 'common-tail-file.log');
    var expected = 0;
    //
    // Performs the actual tail and asserts it.
    //
    function startTailFile() {
      var stream = tailFile({ file: tailable });
      assume(stream).instanceof(Stream);

      stream.on('line', function (buff) {
        expected += 1;
        assume(JSON.parse('' + buff)).is.an('object');
      });
    }

    logOnInterval({
      file: tailable,
      open: startTailFile,
      timeout: 5000
    }, function (err, actual) {
      assume(expected).equals(actual.write);
      done();
    });
  });
});
