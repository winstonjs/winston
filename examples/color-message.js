var winston = require('../lib/winston');

var logger = module.exports = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      colorize: 'all'
    })
  ]
});

logger.log('info', 'This is an information message.');
