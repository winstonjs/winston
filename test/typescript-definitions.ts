import * as winston from '../index';

const logger: winston.Logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({ level: 'info' }),
    ],
});

let err: Error = new Error('ttdt');
logger.error(1, err);
logger.log('info', 'hey dude', { foo: 'bar' });
logger.log({level: 'info', message: 'hey dude', meta: { foo: 'bar' }});

