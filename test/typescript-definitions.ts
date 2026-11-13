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

// Wrappers using Parameters retain every supported logging signature.
function log(...args: Parameters<winston.LogMethod>): winston.Logger {
    return logger.log(...args);
}
function info(...args: Parameters<winston.LeveledLogMethod>): winston.Logger {
    return logger.info(...args);
}
log({ level: 'info', message: 'hello' });
log('info', 'hello %s', 'world');
log('info', { message: 'hello' });
info('hello');
info('hello %s', 'world');
info({ message: 'hello' });
info(err);
info(42);

// @ts-expect-error a message is required
info();
// @ts-expect-error a level alone is not a log entry
log('info');
// @ts-expect-error a log entry needs a level
log({ message: 'hello' });
// @ts-expect-error non-string messages do not accept additional metadata
info({}, {});
// @ts-expect-error non-string messages do not accept additional metadata
log('info', {}, {});
