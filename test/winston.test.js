/*
 * logger-test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const { format } = require('util');
const assume = require('assume');
const winston = require('../lib/winston');

describe('winston', function () {

  it('winston.transports', function () {
    assume(winston.transports).is.an('object');
    assume(winston.Transport).is.a('function');
    assume(!winston.transports.Transport).true();
    assume(winston.transports.Console).is.a('function');
    assume(winston.transports.File).is.a('function');
  });

  it('has expected initial state', function () {
    assume(winston.default.transports).deep.equals([]);
    assume(winston.level).equals('info');
  });

  it('has expected methods', function () {
    assume(winston.config).is.an('object');
    ['createLogger', 'add', 'remove', 'clear', 'child']
      .concat(Object.keys(winston.config.npm.levels))
      .forEach(function (key) {
        assume(winston[key]).is.a('function', 'winston.' + key);
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

  describe('deprecates winston < 3.0.0 properties', function () {
    var deprecated = {
      functions: ['addRewriter', 'addFilter', 'cli', 'clone', 'extend'],
      properties: ['emitErrs', 'levelLength', 'padLevels', 'stripColors']
    };

    deprecated.functions.forEach(function (prop) {
      it(format('.%s()', prop), function () {
        assume(winston[prop]).throws();
      });
    });

    deprecated.properties.forEach(function (prop) {
      it(format('.%s', prop), function () {
        assume(function () {
          var value = winston[prop];
        }).throws();
      });
    });
  });
});
