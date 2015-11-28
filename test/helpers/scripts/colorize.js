/*
 * colorize.js: A test fixture for logging colorized messages
 *
 * (C) 2015 Tom Spencer
 * MIT LICENCE
 *
 */

var winston = require('../../../lib/winston');

var logger = new (winston.Logger)({
  format: winston.format.colorize()
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('Simply a test');
