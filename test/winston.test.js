'use strict';

/*
 * logger-test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const { format } = require('util');
const winston = require('../lib/winston');

describe('winston', () => {
  it('winston.transports', () => {
    assume(winston.transports).is.an('object');
    assume(winston.Transport).is.a('function');
    assume(!winston.transports.Transport).true();
    assume(winston.transports.Console).is.a('function');
    assume(winston.transports.File).is.a('function');
  });

  it('has expected initial state', () => {
    assume(winston.default.transports).deep.equals([]);
    assume(winston.level).equals('info');
  });

  it('has expected methods', () => {
    assume(winston.config).is.an('object');
    ['createLogger', 'add', 'remove', 'clear']
      .concat(Object.keys(winston.config.npm.levels))
      .forEach(key => {
        assume(winston[key]).is.a('function', 'winston.' + key);
      });
  });

  it('exposes version', () => {
    assume(winston.version).equals(require('../package.json').version);
  });

  it('abstract-winston-logger');

  //
  // TODO: Migrate this test once abstract-winston-{transport,logger}
  // test suite modules are completed.
  //
  // "the log() method": helpers.testNpmLevels(winston, "should respond without an error", function (err) {
  //   assert.isNull(err);
  // })

  describe('deprecates winston < 3.0.0 properties', () => {
    const deprecated = {
      functions: ['addRewriter', 'addFilter', 'cli', 'clone', 'extend'],
      properties: ['emitErrs', 'levelLength', 'padLevels', 'stripColors']
    };

    deprecated.functions.forEach(prop => {
      it(format('.%s()', prop), () => {
        assume(winston[prop]).throws();
      });
    });

    deprecated.properties.forEach(prop => {
      it(format('.%s', prop), () => {
        // eslint-disable-next-line max-nested-callbacks
        assume(() => winston[prop]).throws();
      });
    });
  });
});
