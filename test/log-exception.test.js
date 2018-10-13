/*
 * log-exception.test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const winston = require('../lib/winston');
const helpers = require('./helpers');

describe('Logger, ExceptionHandler', function () {
  this.timeout(5000);

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
      var logger = winston.createLogger({
        exceptionHandlers: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: path.join(__dirname, 'fixtures', 'logs', 'filelog.log') })
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
    const scriptDir = path.join(__dirname, 'helpers', 'scripts');
    const child = spawn('node', [path.join(scriptDir, 'exit-on-error.js')]);
    const stdout = [];

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function (line) {
      stdout.push(line);
    });

    setTimeout(function () {
      assume(child.killed).false();
      assume(stdout).deep.equals(['Ignore this error']);
      child.kill();
      done();
    }, 1000);
  });

  describe('.exceptions.handle()', function () {
    describe('should save the error information to the specified file', function () {
      it('when strings are thrown as errors', helpers.assertHandleExceptions({
        script: path.join(__dirname, 'helpers', 'scripts', 'log-string-exception.js'),
        logfile: path.join(__dirname, 'fixtures', 'logs', 'string-exception.log'),
        message: 'OMG NEVER DO THIS STRING EXCEPTIONS ARE AWFUL'
      }));

      it('with a custom winston.Logger instance', helpers.assertHandleExceptions({
        script: path.join(__dirname, 'helpers', 'scripts', 'log-exceptions.js'),
        logfile: path.join(__dirname, 'fixtures', 'logs', 'exception.log')
      }));

      it('with the default winston logger', helpers.assertHandleExceptions({
        script: path.join(__dirname, 'helpers', 'scripts', 'default-exceptions.js'),
        logfile: path.join(__dirname, 'fixtures', 'logs', 'default-exception.log')
      }));
    });
  });

});
