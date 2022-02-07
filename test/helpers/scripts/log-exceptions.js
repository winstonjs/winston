/*
 * log-exceptions.js: A test fixture for logging exceptions in winston.
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENCE
 *
 */

var path = require('path'),
    winston = require('../../../lib/winston');
const testLogFixturesPath = path.join(__dirname, '..', '..', 'fixtures', 'logs');

var logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(testLogFixturesPath, 'exception.log'),
      handleExceptions: true
    })
  ]
});

logger.exceptions.handle();

setTimeout(function () {
  throw new Error('OH NOES! It failed!');
}, 1000);
