const winston = require('../');

const loggers = {
  splat: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.simple()
    ),
    transports: [new winston.transports.Console()],
  }),
  simple: winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
  })
};

const meta = {
  subject: 'Hello, World!',
  message: 'This message is a unique property separate from implicit merging.',
};

loggers.simple.info('email.message is hidden', meta);
loggers.simple.info('email.message is hidden %j\n', meta);

loggers.splat.info('This is overridden by meta', meta);
loggers.splat.info('email.message is shown %j', meta);
