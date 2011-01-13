/*
 * winston.js: Top-level include defining Winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var winston = exports;

winston.default    = {};
winston.transports = require('./winston/transports');
winston.Logger     = require('./winston/logger').Logger;

//
// We create and expose a "defaultLogger" so that the programmer may do the
// following without the need to create an instance of winston.Logger directly:
//   var winston = require('winston');
//   winston.log('info', 'some message');
//   winston.error('some error'); 
//
var defaultLogger = new (winston.Logger)({ transports: { "Console": winston.default } });
Object.keys(defaultLogger.levels).forEach(function (level) {
  winston[level] = function () {
    defaultLogger[level].apply(defaultLogger, arguments);
  };
});

winston.log = function () {
  defaultLogger.log.apply(defaultLogger, arguments);
}

winston.defaultTransports = function () {
  return defaultLogger.transports;
};

winston.add = function () {
  defaultLogger.add.apply(defaultLogger, arguments);
};

winston.remove = function () {
  defaultLogger.remove.apply(defaultLogger, arguments);
};