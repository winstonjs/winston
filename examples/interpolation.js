'use strict';

const { createLogger, format, transports } = require('../');
const logger = createLogger({
  format: format.combine(
    format.splat(),
    format.simple()
  ),
  transports: [
    new transports.Console()
  ]
});

// info: test message my string {}
logger.log('info', 'test message %s', 'my string');

// info: test message my 123 {}
logger.log('info', 'test message %d', 123);

// info: test message first second {number: 123}
logger.log('info', 'test message %s, %s', 'first', 'second', { number: 123 });

// prints "Found error at %s"
logger.info('Found %s at %s', 'error', new Date());
logger.info('Found %s at %s', 'error', new Error('chill winston'));
logger.info('Found %s at %s', 'error', /WUT/);
logger.info('Found %s at %s', 'error', true);
logger.info('Found %s at %s', 'error', 100.00);
logger.info('Found %s at %s', 'error', ['1, 2, 3']);

