/*
 * winston.js: Top-level include defining Winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

require.paths.unshift(require('path').join(__dirname));

var winston = exports;

//
// Expose version using `pkginfo`
//
require('pkginfo')(module, 'version');

//
// Include transports defined by default by winston
//
winston.transports = require('winston/transports');

//
// function findTransport (transport)
//   Helper method to find existing transport
//
winston.findTransport = function (transport) {
  var name, existing = Object.keys(winston.transports).filter(function (k) { 
    return winston.transports[k] === transport;
  });

  return existing.length > 0 ? existing[0].toLowerCase() : null;
};

var utils              = require('winston/utils');
winston.hash           = utils.hash;
winston.clone          = utils.clone;
winston.longestElement = utils.longestElement;
winston.config         = require('winston/config');
winston.addColors      = winston.config.addColors; 
winston.Logger         = require('winston/logger').Logger;

//
// We create and expose a "defaultLogger" so that the programmer may do the
// following without the need to create an instance of winston.Logger directly:
//   var winston = require('winston');
//   winston.log('info', 'some message');
//   winston.error('some error'); 
//
var defaultLogger = new (winston.Logger)({ transports: [new (winston.transports.Console)()] });
utils.setLevels(winston, null, defaultLogger.levels);

['log', 'add', 'remove', 'profile', 'extend', 'cli'].forEach(function (method) {
  winston[method] = function () {
    return defaultLogger[method].apply(defaultLogger, arguments);
  };
});

winston.cli = function (foo, bar) {
  winston.padLevels = true;
  utils.setLevels(winston, defaultLogger.levels, winston.config.cli.levels);
  defaultLogger.setLevels(winston.config.cli.levels);
  winston.config.addColors(winston.config.cli.colors);
  
  if (defaultLogger.transports.console) {
    defaultLogger.transports.console.colorize = true;
    defaultLogger.transports.console.timestamp = false;
  }
  
  return winston;
};

winston.setLevels = function (levels) {
  utils.setLevels(winston, defaultLogger.levels, levels);
  defaultLogger.setLevels(levels);
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
// function defaultTransports ()
//   returns the transports set on the default winston logger 
//
winston.defaultTransports = function () {
  return defaultLogger.transports;
};