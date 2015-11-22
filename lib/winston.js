/*
 * winston.js: Top-level include defining Winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

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
var common        = require('./winston/common');
winston.clone     = common.clone;
winston.config    = require('./winston/config');
winston.addColors = winston.config.addColors;
winston.format    = require('./winston/formats');

//
// Expose core Logging-related prototypes.
//
winston.ExceptionHandler = require('./winston/exception-handler');
winston.Container        = require('./winston/container').Container;
winston.Logger           = require('./winston/logger').Logger;
winston.LogStream        = require('./winston/log-stream');
winston.Transport        = require('./winston/transports/transport');

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
var defaultLogger = new winston.LogStream({
  transports: [new winston.transports.Console()]
});

/**
 * @property {Object} warn
 * Set of simple deprecation notices and a way
 * to expose them for a set of properties.
 *
 * @api private
 */
var warn = {
  deprecated: function warnDeprecated(prop) {
    return function () {
      console.warn('{ %s } was removed in winston@3.0.0.', prop);
    };
  },
  useFormat: function warnFormat(prop) {
    return function () {
      console.warn('{ %s } was removed in winston@3.0.0.', prop);
      console.warn('Use a custom winston.format = winston.format(function) instead.');
    }
  },
  forProperties: function (type, props) {
    props.forEach(function (prop) {
      var notice = warn[type](prop)
      Object.defineProperty(winston, prop, {
        get: notice,
        set: notice
      });
    });
  }
};

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

    //
    // TODO: Remove this and test this behavior is no longer the case.
    //
    Object.keys(defaultLogger.transports).forEach(function(key) {
      defaultLogger.transports[key].level = val;
    });
  }
});

//
// Have friendlier breakage notices for properties that
// were exposed by default on winston < 3.0
//
warn.forProperties('useFormat', ['cli', 'padLevels', 'stripColors']);
warn.forProperties('deprecated', [
  'emitErrs', 'extend', 'levelLength',
  'addRewriter', 'addFilter'
]);

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
