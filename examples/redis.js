var winston = require('../lib/winston');

//
// Create a new winston logger instance with two tranports: Console, and Redis
//
//
// The Console transport will simply output to the console screen
// The Redis tranport will perform an key insert (rpush) to the specified Redis instance
//
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.Redis)({ 'host': 'localhost', 'db': 'winston-log' })
  ]
});

logger.log('info', 'Hello webhook log files!', { 'foo': 'bar' });