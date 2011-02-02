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

winston.Logger = require('winston/logger').Logger;
winston.levels = require('winston/levels');
winston.hash   = require('winston/utils').hash;
winston.clone  = require('winston/utils').clone;
winston.size   = require('winston/utils').size;

//
// We create and expose a "defaultLogger" so that the programmer may do the
// following without the need to create an instance of winston.Logger directly:
//   var winston = require('winston');
//   winston.log('info', 'some message');
//   winston.error('some error'); 
//
var defaultLogger = new (winston.Logger)({ transports: [new (winston.transports.Console)()] });
Object.keys(defaultLogger.levels).forEach(function (level) {
  winston[level] = function () {
    return defaultLogger[level].apply(defaultLogger, arguments);
  };
});

['log', 'add', 'remove', 'profile', 'extend', 'setLevels'].forEach(function (method) {
  winston[method] = function () {
    return defaultLogger[method].apply(defaultLogger, arguments);
  };
});


//
// Define emitErrs property for default logger
//
Object.defineProperty(winston, 'emitErrs', {
  get: function () {
    return defaultLogger.emitErrs;
  },
  set: function (val) {
    defaultLogger.emitErrs = val;
  }
});

//
// function defaultTransports ()
//   returns the transports set on the default winston logger 
//
winston.defaultTransports = function () {
  return defaultLogger.transports;
};