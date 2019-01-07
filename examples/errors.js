const { createLogger, format, transports } = require('../');
const { combine, errors, json } = format;

const logger = createLogger({
  format: combine(
    errors({ stack: true }),
    json()
  ),
  transports: [
    new transports.Console(),
  ]
});

logger.warn(new Error('Error passed as info'));
logger.log('error', new Error('Error passed as message'));

logger.warn('Maybe important error: ', new Error('Error passed as meta'));
logger.log('error', 'Important error: ', new Error('Error passed as meta'));

logger.error(new Error('Error as info'));
