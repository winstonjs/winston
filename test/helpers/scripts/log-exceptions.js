'use strict';

/*
 * log-exceptions.js: A test fixture for logging exceptions in winston.
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENCE
 *
 */

const path = require('path');
const winston = require('../../../lib/winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'fixtures', 'logs', 'exception.log'),
      handleExceptions: true
    })
  ]
});

logger.exceptions.handle();

setTimeout(() => {
  throw new Error('OH NOES! It failed!');
}, 1000);
