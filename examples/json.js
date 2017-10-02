'use strict';

const winston = require('../');

//
// As of winston@3, the default logging format is JSON.
//
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
  ]
});

logger.log('info', 'Hello, this is a raw logging event',   { 'foo': 'bar' });
logger.log('info', 'Hello, this is a raw logging event 2', { 'foo': 'bar' });
