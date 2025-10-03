/*
 * winston.test.js: Tests for instances of the winston Logger
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

const assume = require('assume');
const winston = require('../../../lib/winston');

describe('Winston', function () {
  it('should expose transports', function () {
    assume(winston.transports).is.an('object');
    assume(winston.Transport).is.a('function');
    assume(!winston.transports.Transport).true();
    assume(winston.transports.Console).is.a('function');
    assume(winston.transports.File).is.a('function');
  });

  it('should have the expected initial state', function () {
    assume(winston.default.transports).deep.equals([]);
    assume(winston.level).equals('info');
  });

  describe('exposed interface', function () {
    const expectedMethods = [
      'log',
      'query',
      'stream',
      'add',
      'remove',
      'clear',
      'profile',
      'startTimer',
      'handleExceptions',
      'unhandleExceptions',
      'handleRejections',
      'unhandleRejections',
      'configure',
      'child',
      'createLogger'
    ];
    it.each(expectedMethods)('should expose a method of "%s()"', function (method) {
      const actualMethod = winston[method];
      assume(actualMethod).is.a('function', 'winston.' + method);
    });

    const expectedProperties = [
      { property: 'level', type: 'string' },
      { property: 'exceptions', type: 'object' },
      { property: 'rejections', type: 'object' },
      { property: 'exitOnError', type: 'boolean' }
    ];
    it.each(expectedProperties)('should expose a property of "$property"', function ({ property, type }) {
      const actualProperty = winston[property];
      assume(actualProperty).is.of.a(type);
    });

    const expectedLevelMethods = [
      'error',
      'warn',
      'info',
      'http',
      'verbose',
      'debug',
      'silly'
    ];
    it.each(expectedLevelMethods)('should expose a level method of "%s()"', function (levelMethod) {
      const actualLevelMethod = winston[levelMethod];
      assume(actualLevelMethod).is.a('function', 'winston.' + levelMethod);
      assume(actualLevelMethod).does.not.throw();
    });

    it('exposes the configuration', function () {
      assume(winston.config).is.an('object');
    });

    it('exposes the version', function () {
      assume(winston.version).equals(require('../../../package.json').version);
    });
  });


  describe('Deprecated Winston properties from < v3.x', function () {
    const deprecatedFunctions = ['addRewriter', 'addFilter', 'cli', 'clone', 'extend'];
    const deprecatedProperties = ['emitErrs', 'levelLength', 'padLevels', 'stripColors'];


    it.each(deprecatedFunctions)('should throw when the deprecated function "%s()" is invoked', function (functionName) {
      const invokeFn = function () {
        winston[functionName]();
      };
      assume(invokeFn).throws();
    });

    it.each(deprecatedProperties)('should throw when the deprecated property "%s" is accessed', function (property) {
      const accessProperty = function () {
        winston[property];
      };
      assume(accessProperty).throws();
    });
  });
});
