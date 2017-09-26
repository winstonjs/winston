var winston = require('../lib/winston');

var logger = module.exports = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format(
    winston.format.colorize({ all: true }),
    winston.format.simple()
  )
});

logger.log('info', 'This is an information message.');
