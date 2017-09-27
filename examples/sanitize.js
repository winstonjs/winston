const winston = require('../');

//
// Writing a custom sanitizer to remove `creditCard`
//
const sanitize = winston.format(function (info, opts) {
  if (opts.env === 'production') { delete info.creditCard; }
  return info;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format(
    sanitize({ env: process.env.NODE_ENV }),
    winston.format.json()
  ),
  transports: [
    //
    // Write to error and combined logs.
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.prettyPrint()
  }));
}

for (let i = 0; i < 100; i++) {
  logger.info({
    message: 'Some reasonable message',
    creditCard: i
  })
}
