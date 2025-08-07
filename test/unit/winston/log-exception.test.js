/*
 * log-exception.test.js: Tests for exception data gathering in winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const fs = require('fs');
const fsPromise = require('node:fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const winston = require('../../../lib/winston');
const helpers = require('../../helpers');
const testLogFixturesPath = path.join(__dirname, '..', '..', 'fixtures', 'logs');
const testHelperScriptsPath = path.join(__dirname, '..', '..', 'helpers', 'scripts');

describe('Logger, ExceptionHandler', function () {
  jest.setTimeout(5000);

  describe('.exceptions.unhandle()', function () {
    it('does not log to any transports', function (done) {
      var logFile = path.join(testLogFixturesPath, 'unhandle-exception.log');

      helpers.tryUnlink(logFile);

      spawn('node', [path.join(testHelperScriptsPath, 'unhandle-exceptions.js')])
        .on('exit', function () {
          fs.exists(logFile, function (exists) {
            assume(exists).false();
            done();
          });
        });
    });

    it('handlers immutable', function () {
      var logger = winston.createLogger({
        exceptionHandlers: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: path.join(testLogFixturesPath, 'filelog.log') })
        ]
      });

      assume(logger.exceptions.handlers.size).equals(2);
      assume(process.listeners('uncaughtException').length).equals(1);
      logger.exceptions.unhandle();
      assume(logger.exceptions.handlers.size).equals(2);
      assume(process.listeners('uncaughtException').length).equals(0);
    });
  });

  it('Custom exitOnError function does not exit', function (done) {
    const child = spawn('node', [path.join(testHelperScriptsPath, 'exit-on-error.js')]);
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

  describe('Exception Handler', function () {
    let filePath;
    let processExitSpy;

    beforeEach(function () {
      filePath = path.join(testLogFixturesPath, 'unhandled-exception.log');
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterEach(async () => {
      helpers.tryUnlink(filePath);
      jest.resetAllMocks();
    });

    describe('should save the error information to the specified file', function () {
      describe ('with a Custom Logger instance', function () {
        let logger;
        beforeEach(function () {
          filePath = path.join(testLogFixturesPath, 'unhandled-exception.log');
          processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
          logger = winston.createLogger({
            transports: [
              new winston.transports.File({
                filename: filePath,
                handleExceptions: true
              })
            ]
          });
          logger.exceptions.handle();
        });

        it('when strings are thrown as errors', async () => {
          const expectedMessage = 'OMG NEVER DO THIS STRING EXCEPTIONS ARE AWFUL';

          process.emit('uncaughtException', expectedMessage);
          await new Promise(resolve => setTimeout(resolve, 500));

          expect(processExitSpy).toHaveBeenCalledTimes(1);
          expect(processExitSpy).toHaveBeenCalledWith(1);

          // Read the log file and verify its contents
          const contents = await fsPromise.readFile(filePath, { encoding: 'utf8' });
          const data = JSON.parse(contents);

          // Assert on the log data
          assume(data).is.an('object');
          helpers.assertProcessInfo(data.process);
          helpers.assertOsInfo(data.os);
          helpers.assertTrace(data.trace);
          assume(data.message).includes('uncaughtException: ' + expectedMessage);
        });

        it('with a custom winston.Logger instance', async () => {
          const expectedMessage = 'OMG NEVER DO THIS STRING EXCEPTIONS ARE AWFUL';

          process.emit('uncaughtException', expectedMessage);
          await new Promise(resolve => setTimeout(resolve, 500));

          expect(processExitSpy).toHaveBeenCalledTimes(1);
          expect(processExitSpy).toHaveBeenCalledWith(1);

          // Read the log file and verify its contents
          const contents = await fsPromise.readFile(filePath, { encoding: 'utf8' });
          const data = JSON.parse(contents);

          // Assert on the log data
          assume(data).is.an('object');
          helpers.assertProcessInfo(data.process);
          helpers.assertOsInfo(data.os);
          helpers.assertTrace(data.trace);
          assume(data.message).includes('uncaughtException: ' + expectedMessage);
        });
      });

      it('with the default winston logger', async () => {
        const expectedMessage = 'OMG NEVER DO THIS STRING EXCEPTIONS ARE AWFUL';
        winston.exceptions.handle([
          new winston.transports.File({
            filename: filePath,
            handleExceptions: true
          })
        ]);

        process.emit('uncaughtException', expectedMessage);
        await new Promise(resolve => setTimeout(resolve, 500));

        expect(processExitSpy).toHaveBeenCalledTimes(1);
        expect(processExitSpy).toHaveBeenCalledWith(1);

        // Read the log file and verify its contents
        const contents = await fsPromise.readFile(filePath, { encoding: 'utf8' });
        const data = JSON.parse(contents);

        // Assert on the log data
        assume(data).is.an('object');
        helpers.assertProcessInfo(data.process);
        helpers.assertOsInfo(data.os);
        helpers.assertTrace(data.trace);
        assume(data.message).includes('uncaughtException: ' + expectedMessage);
      });
    });
  });
});
