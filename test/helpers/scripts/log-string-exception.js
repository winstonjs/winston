/*
 * log-string-exceptions.js: A test fixture for logging string exceptions in winston.
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENCE
 *
 */

var path = require('path'),
    winston = require('../../../lib/winston');

var logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'fixtures', 'logs', 'string-exception.log'),
      handleExceptions: true
    })
  ]
});

logger.exceptions.handle();

setTimeout(function () {
  throw 'OMG NEVER DO THIS STRING EXCEPTIONS ARE AWFUL';
}, 1000);
