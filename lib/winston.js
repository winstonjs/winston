/*
 * winston.js: Top-level include defining Winston.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var winston = exports;

winston.default    = {};
winston.Logger     = require('./winston/logger').Logger;
winston.Transports = require('./winston/transports');

var defaultLogger = new (winston.Logger)({transports: {"Console": {level: 2}}})

winston.add = function (transport, options) {
  
};

winston.remove = function (transport) {
  
};