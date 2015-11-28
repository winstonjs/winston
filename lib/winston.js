/*
 * winston.js: Top-level include defining Winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var format = require('util').format;
var common = require('./winston/common');
var warn = common.warn;

var winston = exports;

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
winston.addColors = winston.config.addColors;
winston.format    = require('./winston/formats');

//
// Expose core Logging-related prototypes.
//
winston.ExceptionHandler = require('./winston/exception-handler');
winston.Container        = require('./winston/container').Container;
winston.Logger           = require('./winston/logger');
winston.Transport        = require('winston-transport');

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
var defaultLogger = new winston.Logger({
  //
  // TODO: Remove this transport and display a common
  // warning if logs are attempted to be written with
  // no transports.
  //
  transports: [new winston.transports.Console()]
});

//
// Setup all of the methods for levels from the
// defaultLogger on the `winston` object itself.
//
common.setLevels(winston, null, defaultLogger.levels);

//
// Pass through the target methods onto `winston.
//
[
 'log',    'query', 'stream',  'add',
 'remove', 'clear', 'profile', 'startTimer',
 'handleExceptions', 'unhandleExceptions',
 'configure'
].forEach(function (method) {
  winston[method] = function () {
    return defaultLogger[method].apply(defaultLogger, arguments);
  };
});

// //
// // ### function cli ()
// // Configures the default winston logger to have the
// // settings for command-line interfaces: no timestamp,
// // colors enabled, padded output, and additional levels.
// //
// winston.cli = function () {
//   winston.padLevels = true;
//   common.setLevels(winston, defaultLogger.levels, winston.config.cli.levels);
//   defaultLogger.setLevels(winston.config.cli.levels);
//   winston.config.addColors(winston.config.cli.colors);
//
//   if (defaultLogger.transports.console) {
//     defaultLogger.transports.console.colorize = true;
//     defaultLogger.transports.console.timestamp = false;
//   }
//
//   return winston;
// };

//
// ### function setLevels (target)
// #### @target {Object} Target levels to use
// Sets the `target` levels specified on the default winston logger.
//
winston.setLevels = function (target) {
  common.setLevels(winston, defaultLogger.levels, target);
  defaultLogger.setLevels(target);
};

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
// Have friendlier breakage notices for properties that
// were exposed by default on winston < 3.0
//
warn.forFunctions(winston,  'useFormat',  ['cli']);
warn.forProperties(winston, 'useFormat',  ['padLevels', 'stripColors']);
warn.forFunctions(winston,  'deprecated', ['addRewriter', 'addFilter', 'clone', 'extend']);
warn.forProperties(winston, 'deprecated', ['emitErrs', 'levelLength']);

//
// Define getters / setters for appropriate properties of the
// default logger which need to be exposed by winston.
//
['exitOnError'].forEach(function (prop) {
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
