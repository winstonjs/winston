'use strict';

const winston = require('../');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    //
    // Notice that both arguments have been combined into a single
    // "info" object.
    //
    winston.format(function (info, opts) {
      console.log(`{ reason: ${info.reason}, promise: ${info.promise} }`);
      return info;
    })(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('my message', { reason: 'whatever', promise: 'whenever' });
