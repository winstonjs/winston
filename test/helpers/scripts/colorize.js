'use strict';

/*
 * colorize.js: A test fixture for logging colorized messages
 *
 * (C) 2015 Tom Spencer
 * MIT LICENCE
 *
 */

const winston = require('../../../lib/winston');

const format = winston.format.combine(
  winston.format.colorize({ message: true }),
  winston.format.simple()
);

const logger = winston.createLogger({
  format,
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('Simply a test');
