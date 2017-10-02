/*
 * winston.js: Top-level include defining Winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

const common = require('./winston/common');
const warn = common.warn;

const winston = exports;

//
// Expose version. Use `require` method
// for `webpack` support.
//
winston.version = require('../package').version;

//
// Include transports defined by default by winston
//
winston.transports = require('./winston/transports');

//
// Expose utility methods
//
winston.config    = require('./winston/config');

//
// Hoist format-related functionality from logform.
//
const logform = require('logform');
winston.addColors = logform.levels;
winston.format    = logform.format;

//
// Expose core Logging-related prototypes.
//
winston.createLogger     = require('./winston/create-logger');
winston.ExceptionHandler = require('./winston/exception-handler');
winston.Container        = require('./winston/container').Container;
winston.Transport        = require('winston-transport');

//
// Throw a useful error when users attempt to run `new winston.Logger`.
//
warn.moved(winston, 'createLogger', 'Logger');

//
// We create and expose a default `Container` to `winston.loggers` so that the
// programmer may manage multiple `winston.Logger` instances without any additional overhead.
//
// ### some-file1.js
//
//     var logger = require('winston').loggers.get('something');
//
// ### some-file2.js
//
//     var logger = require('winston').loggers.get('something');
//
winston.loggers = new winston.Container();

//
// We create and expose a 'defaultLogger' so that the programmer may do the
// following without the need to create an instance of winston.Logger directly:
//
//     var winston = require('winston');
//     winston.log('info', 'some message');
//     winston.error('some error');
//
var defaultLogger = winston.createLogger();

//
// Pass through the target methods onto `winston.
//
Object.keys(winston.config.npm.levels).concat([
  'log',    'query', 'stream',  'add',
  'remove', 'clear', 'profile', 'startTimer',
  'handleExceptions', 'unhandleExceptions',
  'configure'
]).forEach(function (method) {
  winston[method] = function () {
    return defaultLogger[method].apply(defaultLogger, arguments);
  };
});

//
// Define getter / setter for the default logger level
// which need to be exposed by winston.
//
Object.defineProperty(winston, 'level', {
  get: function () {
    return defaultLogger.level;
  },
  set: function (val) {
    defaultLogger.level = val;
  }
});

//
// Define getter for `exceptions` which replaces
// `handleExceptions` and `unhandleExceptions`
//
Object.defineProperty(winston, 'exceptions', {
  get: function () { return defaultLogger.exceptions; }
});

//
// Have friendlier breakage notices for properties that
// were exposed by default on winston < 3.0
//
warn.deprecated(winston, 'setLevels');
warn.forFunctions(winston,  'useFormat',  ['cli']);
warn.forProperties(winston, 'useFormat',  ['padLevels', 'stripColors']);
warn.forFunctions(winston,  'deprecated', ['addRewriter', 'addFilter', 'clone', 'extend']);
warn.forProperties(winston, 'deprecated', ['emitErrs', 'levelLength']);

//
// Define getters / setters for appropriate properties of the
// default logger which need to be exposed by winston.
//
['paddings', 'exitOnError'].forEach(function (prop) {
  Object.defineProperty(winston, prop, {
    get: function () {
      return defaultLogger[prop];
    },
    set: function (val) {
      defaultLogger[prop] = val;
    }
  });
});

//
// @default {Object}
// The default transports and exceptionHandlers for
// the default winston logger.
//
Object.defineProperty(winston, 'default', {
  get: function () {
    return {
      exceptionHandlers: defaultLogger.exceptionHandlers,
      transports: defaultLogger.transports
    };
  }
});
