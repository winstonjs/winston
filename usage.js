//
// Temporary sample usage for Winston.
//

var winston = require('../lib/winston');

// Add Riak with specified settings
winston.add('riak', {
  host: 'localhost', 
  level: 'info', 
  auth: {
    'username': 'user',
    'password': 'pass'
  }
});

// Add Loggly with specified settings
winston.add('loggly', {
  level: 'silly'
  auth: {
    username: 'user',
    password: 'pass'
  }
});

// Remove console (set by default)
winston.remove(winston.transports.Console);

//
// Remark: These statements are equivalent
//
winston.log('info', 'some message');
winston.info('some message');

//
// Remark: Metadata usage (equivalent statements)
//
winston.log('info', 'some message', { metadata: 'hi' });
winston.info('some message', { metadata: 'hi'});

var options = {
  emitErrs: false,
  transports: [
    new (winston.transports.Riak)(),
    new (winston.transports.Loggly)({
      subdomain: 'winston',
      inputToken: 'really-long-thing-you-got-from-loggly',
      auth: {
        username: 'user',
        password: 'pass'
      }
    })
  ]
}

var logger = new (winston.Logger)(options);
logger.log('info', { message: 'some message' });
