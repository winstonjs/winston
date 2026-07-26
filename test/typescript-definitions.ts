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
npmLogger.log('error', 'oops').log('warn', 'careful').log('info', 'fyi').log('http', 'req').log('verbose', 'v').log('debug', 'd').log('silly', 's');

// Syslog levels: only syslog-shaped methods should be available.
const syslogLogger = winston.createLogger({
    levels: winston.config.syslog.levels,
});
syslogLogger.emerg('down').alert('page').crit('bad').warning('hmm').notice('fyi').debug('d');
syslogLogger.log('emerg', 'down').log('alert', 'page').log('crit', 'bad').log('warning', 'hmm').log('notice', 'fyi').log('debug', 'd');
// @ts-expect-error - the 'silly' method belongs to npm/cli levels, not syslog
syslogLogger.silly('nope');
// @ts-expect-error - the 'silly' method belongs to npm/cli levels, not syslog
syslogLogger.log('silly', 'nope');

// Fully custom levels: methods are inferred straight from the literal object.
const customLogger = winston.createLogger({
    levels: { ok: 0, meh: 1, bad: 2 },
});
customLogger.ok('fine').meh('eh').bad('uh oh');
customLogger.log('ok', 'fine').log('meh', 'eh').log('bad', 'uh oh');
// @ts-expect-error - typo'd level name should not type-check
customLogger.badd('typo');
// @ts-expect-error - typo'd level name should not type-check
customLogger.log('badd', 'typo');

// @ts-expect-error - level values must be numbers
winston.createLogger({ levels: { ok: 'not a number' } });
