'use strict';

/*
 * default-exceptions.js: A test fixture for logging exceptions with the default winston logger.
 *
 * (C) 2011 Charlie Robbins
 * MIT LICENCE
 *
 */

const path = require('path');
const winston = require('../../../lib/winston');

winston.exceptions.handle([
  new winston.transports.File({
    filename: path.join(__dirname, '..', '..', 'fixtures', 'logs', 'default-exception.log'),
    handleExceptions: true
  })
]);

winston.info('Log something before error');

setTimeout(() => {
  throw new Error('OH NOES! It failed!');
}, 1000);
