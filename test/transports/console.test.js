'use strict';

/*
 * console-test.js: Tests for instances of the Console transport
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const path = require('path');
const assume = require('assume');
const { LEVEL, MESSAGE } = require('triple-beam');
const winston = require('../../lib/winston');
const helpers = require('../helpers');
const stdMocks = require('std-mocks');

const defaultLevels = winston.config.npm.levels;
const transports = {
  defaults: new winston.transports.Console(),
  noStderr: new winston.transports.Console({ stderrLevels: [] }),
  stderrLevels: new winston.transports.Console({
    stderrLevels: ['info', 'error']
  }),
  consoleWarnLevels: new winston.transports.Console({
    consoleWarnLevels: ['warn', 'debug']
  }),
  eol: new winston.transports.Console({ eol: 'X' }),
  syslog: new winston.transports.Console({
    levels: winston.config.syslog.levels
  }),
  customLevelStderr: new winston.transports.Console({
    levels: {
      alpha: 0,
      beta: 1,
      gamma: 2,
      delta: 3,
      epsilon: 4,
    },
    stderrLevels: ['delta', 'epsilon']
  })
};

/**
 * Returns a function that asserts the `transport` has the specified
 * logLevels values in the appropriate logLevelsName member.
 *
 * @param  {TransportStream} transport Transport to assert against
 * @param  {Array} logLevels Set of levels assumed to exist for the specified map
 * @param  {String} logLevelsName The name of the array/map that holdes the log leveles values (ie: 'stderrLevels', 'consoleWarnLevels')
 * @return {function} Assertion function to execute comparison
 */
function assertLogLevelsValues(transport, logLevels, logLevelsName = 'stderrLevels') {
  return function () {
    assume(JSON.stringify(Object.keys(transport[logLevelsName]).sort()))
      .equals(JSON.stringify(logLevels.sort()));
  };
}



describe('Console transport', function () {
  describe('with defaults', function () {
    it('logs all levels to stdout', function () {
      stdMocks.use();
      transports.defaults.levels = defaultLevels;
      Object.keys(defaultLevels)
        .forEach(function (level) {
          const info = {
            [LEVEL]: level,
            message: `This is level ${level}`,
            level
          };

          info[MESSAGE] = JSON.stringify(info);
          transports.defaults.log(info);
        });

      stdMocks.restore();
      var output = stdMocks.flush();
      assume(output.stderr).is.an('array');
      assume(output.stderr).length(0);
      assume(output.stdout).is.an('array');
      assume(output.stdout).length(7);
    });

    it("should set stderrLevels to [] by default", assertLogLevelsValues(
      transports.defaults,
      [],
      'stderrLevels'
    ));
  });

  describe('throws an appropriate error when', function () {
    it("if stderrLevels is set, but not an Array { stderrLevels: 'Not an Array' }", function () {
      assume(function () {
        let throwing = new winston.transports.Console({
          stderrLevels: 'Not an Array'
        })
      }).throws(/Cannot make set from type other than Array of string elements/);
    });

    it("if stderrLevels contains non-string elements { stderrLevels: ['good', /^invalid$/, 'valid']", function () {
      assume(function () {
        let throwing = new winston.transports.Console({
          stderrLevels: ['good', /^invalid$/, 'valid']
        })
      }).throws(/Cannot make set from type other than Array of string elements/);
    });
  });

  it("{ stderrLevels: ['info', 'error'] } logs to them appropriately", assertLogLevelsValues(
    transports.stderrLevels,
    ['info', 'error'],
    'stderrLevels'
  ));
  it("{ consoleWarnLevels: ['warn', 'debug'] } logs to them appropriately", assertLogLevelsValues(
    transports.consoleWarnLevels,
    ['warn', 'debug'],
    'consoleWarnLevels'
  ));

  it('{ eol } adds a custom EOL delimiter', function (done) {
    stdMocks.use();
    transports.eol.log({ [MESSAGE]: 'info: testing. 1 2 3...' }, function () {
      stdMocks.restore();

      var output = stdMocks.flush(),
          line   = output.stdout[0];

      assume(line).equal('info: testing. 1 2 3...X');
      done();
    });
  });
});

require('abstract-winston-transport')({
  name: 'Console',
  Transport: winston.transports.Console
});

// vows.describe('winston/transports/console').addBatch({
//   "An instance of the Console Transport": {
//     "with syslog levels": {
//       "should have the proper methods defined": function () {
//         helpers.assertConsole(syslogTransport);
//       },
//       "the log() method": helpers.testSyslogLevels(syslogTransport, "should respond with true", function (ign, err, logged) {
//         assert.isNull(err);
//         assert.isTrue(logged);
//       })
//     }
//   }
// }).addBatch({
//   "An instance of the Console Transport with no options": {
//     "should log only 'error' and 'debug' to stderr": helpers.testLoggingToStreams(
//       winston.config.npm.levels, defaultTransport, ['debug', 'error'], stdMocks
//     )
//   }
// }).addBatch({
//   "An instance of the Console Transport with debugStdout set": {
//     "should set stderrLevels to 'error' by default": helpers.assertStderrLevels(
//       debugStdoutTransport,
//       ['error']
//     ),
//     "should log only the 'error' level to stderr": helpers.testLoggingToStreams(
//       winston.config.npm.levels, debugStdoutTransport, ['error'], stdMocks
//     )
//   }
// }).addBatch({
//   "An instance of the Console Transport with stderrLevels set": {
//     "should log only the levels in stderrLevels to stderr": helpers.testLoggingToStreams(
//       winston.config.npm.levels, stderrLevelsTransport, ['info', 'warn'], stdMocks
//     )
//   }
// }).addBatch({
//   "An instance of the Console Transport with stderrLevels set to an empty array": {
//     "should log only to stdout, and not to stderr": helpers.testLoggingToStreams(
//       winston.config.npm.levels, noStderrTransport, [], stdMocks
//     )
//   }
// }).addBatch({
//   "An instance of the Console Transport with custom levels and stderrLevels set": {
//     "should log only the levels in stderrLevels to stderr": helpers.testLoggingToStreams(
//       customLevels, customLevelsAndStderrTransport, ['delta', 'epsilon'], stdMocks
//     )
//   }
// }).export(module);
