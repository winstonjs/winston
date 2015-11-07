/*
 * logger-test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var assume = require('assume'),
    winston = require('../lib/winston');

describe('winston', function () {

  it('has expected methods', function () {
    assume(winston.transports).is.an('object');
    assume(winston.Transport).is.a('function');
    assume(!winston.transports.Transport).true();
    assume(winston.transports.Console).is.a('function');
    assume(winston.transports.File).is.a('function');
    assume(winston.default.transports[0]).is.an('object');
    assume(winston.config).is.an('object');
    ['Logger', 'add', 'remove', 'extend', 'clear']
      .concat(Object.keys(winston.config.npm.levels))
      .forEach(function (key) {
        assume(winston[key]).is.a('function');
      });
  });

  it('exposes version', function () {
    assume(winston.version).equals(require('../package').version);
  });

  it('abstract-winston-logger');

  //
  // TODO: Migrate this test once abstract-winston-{transport,logger}
  // test suite modules are completed.
  //
  // "the log() method": helpers.testNpmLevels(winston, "should respond without an error", function (err) {
  //   assert.isNull(err);
  // })
});
