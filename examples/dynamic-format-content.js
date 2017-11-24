'use strict';

const winston = require('../');

const logger = module.exports = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format(function dynamicContent(info, opts) {
      info.message = '[dynamic content] ' + info.message;
      return info;
    })(),
    winston.format.simple()
  )
});

logger.log('info', 'This is an information message.');
