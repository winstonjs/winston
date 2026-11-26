import * as winston from '../index';

let logger: winston.Logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({ level: 'info' }),
    ],
});

let err: Error = new Error('ttdt');
logger.error('The error was: ', err);
logger.log('info', 'hey dude', { foo: 'bar' });
logger.log({ level: 'info', message: 'hey dude', meta: { foo: 'bar' } });

// Default logger
winston.http('New incoming connection');
winston.error('The error was: ', err);

winston.exceptions.handle(new winston.transports.File({ filename: 'exceptions.log' }));

const loggerOptions: winston.LoggerOptions = {
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({ level: 'info' }),
    ],
};

// assign the returned values to the logger variable,
// to make sure that the methods have 'Logger' declared as their return type
logger = winston.loggers.add('category', loggerOptions);
logger = winston.loggers.add('category');
logger = winston.loggers.get('category', loggerOptions);
logger = winston.loggers.get('category');

const hasLogger: boolean = winston.loggers.has('category');
winston.loggers.close('category');
winston.loggers.close();

let container: winston.Container = new winston.Container(loggerOptions);
logger = container.get('testLogger');

logger = container.loggers.get('testLogger')!;

container.close('testLogger');

const level = container.options.level;

container = new winston.Container();
logger = container.get('testLogger2');

logger.isLevelEnabled('debug');
logger.isErrorEnabled();
logger.isWarnEnabled();
logger.isInfoEnabled();
logger.isVerboseEnabled();
logger.isDebugEnabled();
logger.isSillyEnabled();

// `Parameters<>` and `infer` use the last overload, which must accept
// everything the other overloads accept.
function logWithSpread(...args: Parameters<winston.LeveledLogMethod>): void {
    logger.info(...args);
}
logWithSpread('a log message');
logWithSpread({ infoObjectKey: 'infoObjectVal' });

function rawLogWithSpread(...args: Parameters<winston.LogMethod>): void {
    logger.log(...args);
}
rawLogWithSpread('info', 'a log message');
rawLogWithSpread({ level: 'info', message: 'a log message' });
