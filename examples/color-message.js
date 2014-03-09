var winston = require('../lib/winston');

var logger = module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: 'all'
    })
  ]
});

logger.log('info', 'This is an information message.');