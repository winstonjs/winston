const winston = require('../');

let transports = {
  console: new winston.transports.Console({level: 'info'})
};

let {format} = winston;
let logger = winston.createLogger({
  format: format.combine(
    format.splat(),
    format.simple()
  ),
  transports: [transports.console]
});


logger.log(
  'info',
  'any message',
  { label: 'label!' }
);

logger.log(
  'info',
  'let\'s %s some %s',
  'interpolate',
  'splat parameters',
  { label: 'label!' }
);

const terr = new Error('lol please stop doing this');
terr.enum = true;
logger.log(
  'info',
  'any message',
  terr
);

logger.log(
  'info',
  'let\'s %s some %s',
  'interpolate',
  'splat parameters',
  terr
);

logger.log(
  'info',
  'first is a string %s [[%j]]',
  'behold a string',
  { lol: 'what did charlie do' }
);

logger.log(
  'info',
  'first is an object [[%j]]',
  { lol: 'what did charlie do' }
);

/*
const simple = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

// Implicit Object.assign to message
const email = {
  subject: 'Hello, World!',
  message: 'Hello mr.World, sorry, but you will not see this message in the console.',
};

console.log('console.log:', email);//works as expected
simple.info('simple.info: ', email);//no 'message'
logger.info('logger.info: ', email);//no 'message'
console.log('console.log again:', email);//still works as expected
*/
