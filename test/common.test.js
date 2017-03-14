/*
 * common.test.js: Tests for lib/winston/common.js
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assume = require('assume'),
    fs = require('fs'),
    path = require('path'),
    winston = require('../lib/winston'),
    common = require('../lib/winston/common'),
    Stream = require('stream').Stream,
    helpers = require('./helpers');

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
  var logger = new winston.Logger({ transports: [transport] });

  if (open) {
    transport.once('open', open);
  }

  let counters = {
    write: 0,
    read: 0
  };

  fs.unlink(filename, function () {
    const intervalId = setInterval(function () {
      logger.info(++counters.write + message);
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

describe('winston/common', function () {
  this.timeout(10 * 1000);

  it('winston.paddings', function () {
    assume(winston.paddings).is.an('object');
    assume(winston.paddings).deep.equals({
      error: '  ',
      warn: '   ',
      info: '   ',
      http: '   ',
      verbose: '',
      debug: '  ',
      silly: '  '
    });
  });

  it('setLevels(syslog)', function () {
    winston.setLevels(winston.config.syslog.levels);

    assume(winston.transports).is.an('object');
    assume(winston.transports.Console).is.a('function');
    assume(winston.default.transports).is.an('array');
    assume(winston.config).is.an('object');

    var newLevels = Object.keys(winston.config.syslog.levels);
    newLevels.forEach(function (key) {
      assume(winston[key]).is.a('function');
    });

    assume(winston.paddings).deep.equals({
      emerg: '  ',
      alert: '  ',
      crit: '   ',
      error: '  ',
      warning: '',
      notice: ' ',
      info: '   ',
      debug: '  '
    });

    Object.keys(winston.config.npm.levels)
      .filter(function (key) {
        return newLevels.indexOf(key) === -1;
      })
      .forEach(function (key) {
        assume(typeof winston[key]).equals('undefined');
      });
  });

  describe('tailFile', function () {
    it('is a function', function () {
      assume(common.tailFile).is.a('function');
      assume(common.tailFile.length).equals(2);
    });

    it('returns a stream that emits "line" for every line', function (done) {
      var tailable = path.join(__dirname, 'fixtures', 'logs', 'common-tail-file.log');
      var expected = 0;
      //
      // Performs the actual tail and asserts it.
      //
      function startTailFile() {
        var stream = common.tailFile({ file: tailable });
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

  //
  // Reset levels once we have tested setLevels works
  // as expected.
  //
  after(function () {
    winston.setLevels(winston.config.npm.levels);
  });
});
