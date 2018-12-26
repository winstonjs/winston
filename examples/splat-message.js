const winston = require('../');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

const meta = {
  subject: 'Hello, World!',
  message: 'This message is a unique property separate from implicit merging.',
};

logger.info('email.message is hidden', email);
logger.info('email.message is shown %j', email);
