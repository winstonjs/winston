var winston = require('../lib/winston');

var logger = module.exports = new(winston.Logger)({
  transports: [
    new(winston.transports.Console)({
      picking: ['World', 'nice'],
    })
  ]
});

logger.log('info', 'Hello World');
logger.log('info', 'Howdy?');
logger.log('info', 'What a nice day.');
logger.log('info', 'The World Is Great!');
logger.log('info', 'Goodbye everyone.');
logger.log('info', 'Bye.');
