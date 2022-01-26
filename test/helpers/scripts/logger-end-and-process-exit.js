'use strict';

const path = require('path');
const winston = require('../../../lib/winston');


var logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'fixtures', 'logs', 'logger-end-and-process-exit.log')
    })
  ]
});


logger.on('finish', () => {
  process.exit(0);
});

logger.info('CHILL WINSTON!', { seriously: true });

logger.end();
