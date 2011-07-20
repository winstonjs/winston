/*
 * winston.js: Top-level include defining Winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var winston = exports;

//
// Expose version using `pkginfo`
//
require('pkginfo')(module, 'version');

//
// Include transports defined by default by winston
//
winston.transports = require('./winston/transports');

var internal           = require('./winston/internal');
winston.hash           = internal.hash;
winston.clone          = internal.clone;
winston.longestElement = internal.longestElement;
winston.config         = require('./winston/config');
winston.addColors      = winston.config.addColors; 
winston.Logger         = require('./winston/logger').Logger;

//
// We create and expose a 'defaultLogger' so that the programmer may do the
// following without the need to create an instance of winston.Logger directly:
//
//     var winston = require('winston');
//     winston.log('info', 'some message');
//     winston.error('some error'); 
//
var defaultLogger = new winston.Logger({ 
  transports: [new winston.transports.Console()] 
});

//
// Pass through the target methods onto `winston.
//
internal.setLevels(winston, null, defaultLogger.levels);
['log', 'add', 'remove', 'profile', 'extend', 'cli'].forEach(function (method) {
  winston[method] = function () {
    return defaultLogger[method].apply(defaultLogger, arguments);
  };
});

//
// ### function cli ()
// Configures the default winston logger to have the
// settings for command-line interfaces: no timestamp,
// colors enabled, padded output, and additional levels.
//
winston.cli = function () {
  winston.padLevels = true;
  internal.setLevels(winston, defaultLogger.levels, winston.config.cli.levels);
  defaultLogger.setLevels(winston.config.cli.levels);
  winston.config.addColors(winston.config.cli.colors);
  
  if (defaultLogger.transports.console) {
    defaultLogger.transports.console.colorize = true;
    defaultLogger.transports.console.timestamp = false;
  }
  
  return winston;
};

//
// ### function setLevels (target)
// #### @target {Object} Target levels to use
// Sets the `target` levels specified on the default winston logger.
//
winston.setLevels = function (target) {
  internal.setLevels(winston, defaultLogger.levels, target);
  defaultLogger.setLevels(target);
};

//
// Define getters / setters for appropriate properties of the 
// default logger which need to be exposed by winston.
//
['emitErrs', 'padLevels', 'levelLength'].forEach(function (prop) {
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
// @transports {Object} 
// The default transports for the default winston logger.
//
Object.defineProperty(winston, 'defaultTransports', {
  get: function () {
    return defaultLogger.transports;
  }
});