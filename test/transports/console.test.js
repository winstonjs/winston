'use strict';

/*
 * console-test.js: Tests for instances of the Console transport
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var path = require('path'),
    assume = require('assume'),
    winston = require('../../lib/winston'),
    helpers = require('../helpers'),
    stdMocks = require('std-mocks');

const defaultLevels = winston.config.npm.levels;
const transports = {
  defaults: new (winston.transports.Console)(),
  noStderr: new (winston.transports.Console)({ stderrLevels: [] }),
  debugStdout: new (winston.transports.Console)({ debugStdout: true }),
  stderrLevels: new (winston.transports.Console)({
    stderrLevels: ['info', 'warn']
  }),
  syslog: new (winston.transports.Console)({
    levels: winston.config.syslog.levels
  }),
  customLevelStderr: new (winston.transports.Console)({
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

describe('Console transport', function () {
  it('(with defaults) logs all levels (EXCEPT error and debug) to stdout', function () {
    stdMocks.use();
    transports.defaults.levels = defaultLevels;
    Object.keys(defaultLevels)
      .forEach(function (level) {
        const info = {
          message: `This is level ${level}`,
          level
        };

        info.raw = JSON.stringify(info);
        transports.defaults.log(info);
      });

    stdMocks.restore();
    var output = stdMocks.flush();
    assume(output.stderr).is.an('array');
    assume(output.stderr).length(2);
    assume(output.stdout).is.an('array');
    assume(output.stdout).length(5);
  });

  it('{ debugStdout, stderrLevels } throws the appropriate error', function () {
    assume(function () {
      let throwing = new winston.transports.Console({
        stderrLevels: ['foo', 'bar'],
        debugStdout: true
      })
    }).throws(/Cannot set debugStdout and stderrLevels/);
  });
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
//     },
//     "with end-of-line": {
//       topic : function() {
//         npmTransport.eol = 'X';
//         stdMocks.use();
//         npmTransport.log('info', 'Le message', { meta: true }, this.callback);
//       },
//       "should have end-of-line character appended": function () {
//         stdMocks.restore();
//         var output = stdMocks.flush(),
//             line   = output.stdout[0];
//         console.dir(line);

//         assert.equal(line, 'info: Le message meta=trueX');
//       }
//     }
//   }
// }).addBatch({
//   "An instance of the Console Transport with no options": {
//     "should set stderrLevels to 'error' and 'debug' by default": helpers.assertStderrLevels(
//       defaultTransport,
//       ['error', 'debug']
//     ),
//     "should log only 'error' and 'debug' to stderr": helpers.testLoggingToStreams(
//       winston.config.npm.levels, defaultTransport, ['debug', 'error'], stdMocks
//     )
//   }
// }).addBatch({
//   "An instance of the Console Transport with debugStdout set": {
//     "should throw an Error if stderrLevels is set": helpers.assertOptionsThrow(
//       { debugStdout: true, stderrLevels: ['debug'] },
//       "Error: Cannot set debugStdout and stderrLevels together"
//     ),
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
//     "should throw an Error if stderrLevels is set but not an Array": helpers.assertOptionsThrow(
//       { debugStdout: false, stderrLevels: new String('Not an Array') },
//       "Error: Cannot set stderrLevels to type other than Array"
//     ),
//     "should throw an Error if stderrLevels contains non-string elements": helpers.assertOptionsThrow(
//       { debugStdout: false, stderrLevels: ["good", /^invalid$/, "valid"] },
//       "Error: Cannot have non-string elements in stderrLevels Array"
//     ),
//     "should correctly set stderrLevels": helpers.assertStderrLevels(
//       stderrLevelsTransport,
//       ['info', 'warn']
//     ),
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
