/*
 * colorize.js: A test fixture for logging colorized messages
 *
 * (C) 2015 Tom Spencer
 * MIT LICENCE
 *
 */

var winston = require('../../../lib/winston');

var logger = new (winston.Logger)({
    transports: [
      new winston.transports.Console({ colorize: process.argv[2] === 'true' })
    ]
  });
logger.info('Simply a test');
