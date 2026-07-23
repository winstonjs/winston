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

// Default (npm) levels, inferred without an explicit generic argument.
const npmLogger = winston.createLogger({ });
npmLogger.error('oops').warn('careful').info('fyi').http('req').verbose('v').debug('d').silly('s');

// Syslog levels: only syslog-shaped methods should be available.
const syslogLogger = winston.createLogger({
    levels: winston.config.syslog.levels,
});
syslogLogger.emerg('down').alert('page').crit('bad').warning('hmm').notice('fyi').debug('d');
// @ts-expect-error - the 'silly' method belongs to npm/cli levels, not syslog
syslogLogger.silly('nope');

// Fully custom levels: methods are inferred straight from the literal object.
const customLogger = winston.createLogger({
    levels: { ok: 0, meh: 1, bad: 2 },
});
customLogger.ok('fine').meh('eh').bad('uh oh');
// @ts-expect-error - typo'd level name should not type-check
customLogger.badd('typo');
