'use strict';

/*
 * unhandle-exceptions.js: A test fixture for using `.unhandleExceptions()` winston.
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
      filename: path.join(__dirname, '..', 'logs', 'unhandle-exception.log')
    })
  ]
});

logger.transports[0].transport.handleExceptions;

logger.exceptions.handle();
logger.exceptions.unhandle();

setTimeout(() => {
  throw new Error('OH NOES! It failed!');
}, 200);
