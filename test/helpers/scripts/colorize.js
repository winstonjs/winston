/*
 * colorize.js: A test fixture for logging colorized messages
 *
 * (C) 2015 Tom Spencer
 * MIT LICENCE
 *
 */

var winston = require('../../../lib/winston');

var format = winston.format(
  winston.format.colorize(),
  winston.format.simple()
);

var logger = new (winston.Logger)({
  format: format,
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('Simply a test');
