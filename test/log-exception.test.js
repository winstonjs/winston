/*
 * log-exception.test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assume = require('assume'),
    fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    winston = require('../lib/winston'),
    helpers = require('./helpers');

describe('Logger, ExceptionHandler', function () {
  describe('.exceptions.unhandle()', function () {
    it('does not log to any transports', function (done) {
      var logFile = path.join(__dirname, 'fixtures', 'logs', 'unhandle-exception.log');

      helpers.tryUnlink(logFile);

      spawn('node', [path.join(__dirname, 'helpers', 'scripts', 'unhandle-exceptions.js')])
        .on('exit', function () {
          fs.exists(logFile, function (exists) {
            assume(exists).false();
            done();
          });
        });
    });

    it('handlers immutable', function () {
      //
      // A single default listener is added by mocha confirming
      // that our assumptions about mocha are maintained.
      //
      assume(process.listeners('uncaughtException').length).equals(1);

      var logger = new winston.Logger({
        exceptionHandlers: [
          new (winston.transports.Console)(),
          new (winston.transports.File)({ filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log' )})
        ]
      });

      assume(logger.exceptions.handlers.size).equals(2);
      assume(process.listeners('uncaughtException').length).equals(2);
      logger.exceptions.unhandle();
      assume(logger.exceptions.handlers.size).equals(2);
      assume(process.listeners('uncaughtException').length).equals(1);
    });
  });

  it('Custom exitOnError function does not exit', function (done) {
    var scriptDir = path.join(__dirname, 'helpers', 'scripts'),
        child = spawn('node', [path.join(scriptDir, 'exit-on-error.js')]),
        stdout = [];

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function (line) {
      stdout.push(line);
    });

    setTimeout(function () {
      assume(child.killed).false();
      assume(stdout).deep.equals(['Ignore this error']);
      child.kill();
      done();
    }, 300);
  });

  //
  // TODO: (Re)add these tests from winston@2
  //
  // vows.describe('winston/logger/exceptions').addBatch({
  //   "When using winston": {
  //     "the handleException() method": {
  //       "with a custom winston.Logger instance": helpers.assertHandleExceptions({
  //         script: path.join(__dirname, 'fixtures', 'scripts', 'log-exceptions.js'),
  //         logfile: path.join(__dirname, 'fixtures', 'logs', 'exception.log')
  //       }),
  //       "with the default winston logger": helpers.assertHandleExceptions({
  //         script: path.join(__dirname, 'fixtures', 'scripts', 'default-exceptions.js'),
  //         logfile: path.join(__dirname, 'fixtures', 'logs', 'default-exception.log')
  //       }),
  //       "when strings are thrown as errors": helpers.assertHandleExceptions({
  //         script: path.join(__dirname, 'fixtures', 'scripts', 'log-string-exception.js'),
  //         logfile: path.join(__dirname, 'fixtures', 'logs', 'string-exception.log'),
  //         message: 'OMG NEVER DO THIS STRING EXCEPTIONS ARE AWFUL'
  //       }),
  //     }
  //   }
  // });
});
