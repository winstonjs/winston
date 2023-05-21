/**
 * winston.js: Top-level include defining Winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

const logform = require('logform');
const { warn } = require('./winston/common');
const { version } = require('../package.json');
const transports = require('./winston/transports');
const config = require('./winston/config');
const createLogger = require('./winston/create-logger');
const ExceptionHandler = require('./winston/exception-handler');
const RejectionHandler = require('./winston/rejection-handler');
const Container = require('./winston/container');
const Transport = require('winston-transport');

/**
 * We create and expose a 'defaultLogger' so that the programmer may do the
 * following without the need to create an instance of winston.Logger directly:
 * @example
 *   const winston = require('winston');
 *   winston.log('info', 'some message');
 *   winston.error('some error');
 */
const defaultLogger = createLogger();

// Expose all the required modules and variables
const winston = {
  // Expose version. Use `require` method for `webpack` support.
  version,
  // Include transports defined by default by winston
  transports,
  // Expose utility methods
  config,
  // Hoist format-related functionality from logform.
  addColors: logform.levels,
  // Hoist format-related functionality from logform.
  format: logform.format,
  // Expose core Logging-related prototypes.
  createLogger,
  // Expose core Logging-related prototypes.
  ExceptionHandler,
  // Expose core Logging-related prototypes.
  RejectionHandler,
  // Expose core Logging-related prototypes.
  Container,
  // Expose core Logging-related prototypes.
  Transport,
  /**
   * We create and expose a default `Container` to `winston.loggers` so that the
   * programmer may manage multiple `winston.Logger` instances without any
   * additional overhead.
   * @example
   *   // some-file1.js
   *   const logger = require('winston').loggers.get('something');
   *
   *   // some-file2.js
   *   const logger = require('winston').loggers.get('something');
   */
  loggers: new Container(),


  /**
   * Define getter / setter for the default logger level which need to be exposed
   * by winston.
   * @type {string}
   */
  get level() {
    return defaultLogger.level;
  },

  set level(val) {
    defaultLogger.level = val;
  },

  /**
   * Define getter for `exceptions` which replaces `handleExceptions` and
   * `unhandleExceptions`.
   * @type {Object}
   */
  get exceptions() {
    return defaultLogger.exceptions;
  },

  /**
   * Define getters / setters for appropriate properties of the default logger
   * which need to be exposed by winston.
   */
  get exitOnError() {
    return defaultLogger.exitOnError;
  },

  set exitOnError(val) {
    defaultLogger.exitOnError = val;
  },

  /**
   * The default transports and exceptionHandlers for the default winston logger.
   * @type {Object}
   */
  get default() {
    return {
      exceptionHandlers: defaultLogger.exceptionHandlers,
      rejectionHandlers: defaultLogger.rejectionHandlers,
      transports: defaultLogger.transports
    };
  }
};

// Pass through the target methods onto `winston.
Object.keys(config.npm.levels)
  .concat([
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
    'child'
  ])
  .forEach(
    method => (winston[method] = (...args) => defaultLogger[method](...args))
  );


// Have friendlier breakage notices for properties that were exposed by default
// on winston < 3.0.
warn.deprecated(winston, 'setLevels');
warn.forFunctions(winston, 'useFormat', ['cli']);
warn.forProperties(winston, 'useFormat', ['padLevels', 'stripColors']);
warn.forFunctions(winston, 'deprecated', [
  'addRewriter',
  'addFilter',
  'clone',
  'extend'
]);
warn.forProperties(winston, 'deprecated', ['emitErrs', 'levelLength']);
// Throw a useful error when users attempt to run `new winston.Logger`.
warn.moved(winston, 'createLogger', 'Logger');

module.exports = winston;
