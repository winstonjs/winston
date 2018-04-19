const winston = require('../');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.label({ label: '[my-label]' }),
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('Hello there. How are you?');
