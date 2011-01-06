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

winston.defaultLogger = new (winston.Logger)({transports: {"Console": {level: 2}}});

winston.add = function (transport, options) {
  
};

winston.remove = function (transport) {
  
};