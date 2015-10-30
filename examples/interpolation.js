var w = require('./');

w.info('Found %s at %s', 'error', new Date());
w.info('Found %s at %s', 'error', new Error('chill winston'));
w.info('Found %s at %s', 'error', /WUT/);
w.info('Found %s at %s', 'error', true);
w.info('Found %s at %s', 'error', 100.00);
w.info('Found %s at %s', 'error', ['1, 2, 3']);
// prints "Found error at %s"

// console.log('Found %s at %s', 'error', new Date())
// prints "Found error at Tue Jan 20 2015 10:14:26 GMT-0800 (PST)"
