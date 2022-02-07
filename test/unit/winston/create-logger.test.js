const winston = require("../../../lib/winston");
const assume = require("assume");
const isStream = require("is-stream");
const {format} = require("../../../lib/winston");
const TransportStream = require("winston-transport");

describe('Create Logger', function () {
    it('should build a logger with default values', function () {
        let logger = winston.createLogger();
        assume(logger).is.an('object');
        assume(isStream(logger.format));
        assume(logger.level).equals('info');
        assume(logger.exitOnError).equals(true);
    });

    it('new Logger({ silent: true })', function (done) {
        const neverLogTo = new TransportStream({
            log: function (info) {
                assume(false).true('TransportStream was improperly written to');
            }
        });

        var logger = winston.createLogger({
            transports: [neverLogTo],
            silent: true
        });

        logger.log({
            level: 'info',
            message: 'This should be ignored'
        });

        setImmediate(() => done());
    });

    it('new Logger({ parameters })', function () {
        let myFormat = format(function (info, opts) {
            return info;
        })();

        let logger = winston.createLogger({
            format: myFormat,
            level: 'error',
            exitOnError: false,
            transports: []
        });

        assume(logger.format).equals(myFormat);
        assume(logger.level).equals('error');
        assume(logger.exitOnError).equals(false);
        assume(logger._readableState.pipesCount).equals(0);
    });

    it('new Logger({ levels }) defines custom methods', function () {
        let myFormat = format(function (info, opts) {
            return info;
        })();

        let logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            format: myFormat,
            level: 'error',
            exitOnError: false,
            transports: []
        });

        Object.keys(winston.config.syslog.levels).forEach(level => {
            assume(logger[level]).is.a('function');
        })
    });

    it('new Logger({ levels }) custom methods are not bound to instance', function (done) {
        let logger = winston.createLogger({
            level: 'error',
            exitOnError: false,
            transports: []
        });

        let logs = [];
        let extendedLogger = Object.create(logger, {
            write: {
                value: function (...args) {
                    logs.push(args);
                    if (logs.length === 4) {
                        assume(logs.length).is.eql(4);
                        assume(logs[0]).is.eql([{test: 1, level: 'info'}]);
                        assume(logs[1]).is.eql([{test: 2, level: 'warn'}]);
                        assume(logs[2]).is.eql([{message: 'test3', level: 'info'}])
                        assume(logs[3]).is.eql([{
                            with: 'meta',
                            test: 4,
                            level: 'warn',
                            message: 'a warning'
                        }]);

                        done();
                    }
                }
            }
        });

        extendedLogger.log('info', {test: 1});
        extendedLogger.log('warn', {test: 2});
        extendedLogger.info('test3');
        extendedLogger.warn('a warning', {with: 'meta', test: 4});
    });
});
