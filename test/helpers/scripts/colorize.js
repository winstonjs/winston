/*
 * colorize.js: A test fixture for logging colorized messages
 *
 * (C) 2015 Tom Spencer
 * MIT LICENCE
 *
 */

var winston = require('../../../lib/winston');

var format = winston.format.combine(
  winston.format.colorize({ message: true }),
  winston.format.simple()
);

var logger = winston.createLogger({
  format: format,
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('Simply a test');
