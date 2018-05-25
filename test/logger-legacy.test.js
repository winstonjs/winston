'use strict';

/*
 * logger-legacy.test.js: Tests for Legacy APIs of winston < 3.0.0
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

'use strict';

const assume = require('assume');
const helpers = require('./helpers');
const LegacyTransport = require('./helpers/mocks/legacy-transport');
const { MESSAGE } = require('triple-beam');
const stdMocks = require('std-mocks');
const winston = require('../lib/winston');

describe('Logger (legacy API)', () => {
  it('new Logger({ DEPRECATED })', () => {
    const deprecated = [
      { colors: true },
      { emitErrs: true },
      { formatters: [] },
      { padLevels: true },
      { rewriters: [] },
      { stripColors: true }
    ];

    deprecated.forEach(opts => {
      assume(() => winston.createLogger(opts)).throws(/Use a custom/);
    });
  });

  it('.add(LegacyTransport)', () => {
    stdMocks.use();
    const logger = winston.createLogger();
    const transport = new LegacyTransport();
    logger.add(transport);
    stdMocks.restore();
    const output = stdMocks.flush();

    assume(logger._readableState.pipesCount).equals(1);
    assume(logger._readableState.pipes.transport).is.an('object');
    assume(logger._readableState.pipes.transport).equals(transport);
    assume(output.stderr.join('')).to.include('legacy-test is a legacy winston transport. Consider upgrading');
  });

  it('.add(LegacyTransport) multiple', () => {
    stdMocks.use();
    const logger = winston.createLogger({
      transports: [
        new LegacyTransport(),
        new LegacyTransport(),
        new LegacyTransport()
      ]
    });

    stdMocks.restore();
    const output = stdMocks.flush();

    assume(logger._readableState.pipesCount).equals(3);
    const errorMsg = 'legacy-test is a legacy winston transport. Consider upgrading';
    assume(output.stderr.join('')).to.include(errorMsg);
  });

  it('.remove() [LegacyTransportStream]', () => {
    const transports = [
      new winston.transports.Console(),
      new (LegacyTransport)()
    ];

    const logger = winston.createLogger({ transports });

    assume(logger.transports.length).equals(2);
    logger.remove(transports[1]);
    assume(logger.transports.length).equals(1);
    assume(logger.transports[0]).equals(transports[0]);
  });

  it('.log(level, message)', done => {
    const logger = helpers.createLogger(info => {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('Some super awesome log message');
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    logger.log('info', 'Some super awesome log message');
  });

  it(`.log(level, undefined) creates info with { message: undefined }`, done => {
    const logger = helpers.createLogger(info => {
      // eslint-disable-next-line no-undefined
      assume(info.message).equals(undefined);
      done();
    });

    // eslint-disable-next-line no-undefined
    logger.log('info', undefined);
  });

  it(`.log(level, null) creates info with { message: null }`, done => {
    const logger = helpers.createLogger(info => {
      assume(info.message).equals(null);
      done();
    });

    logger.log('info', null);
  });

  it(`.log(level, new Error()) uses Error instance as info`, done => {
    const err = new Error('test');
    const logger = helpers.createLogger(info => {
      assume(info).instanceOf(Error);
      assume(info).equals(err);
      done();
    });

    logger.log('info', err);
  });

  it('.log(level, message, meta)', done => {
    const meta = { one: 2 };
    const logger = helpers.createLogger(info => {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('Some super awesome log message');
      assume(info.one).equals(2);
      assume(info[MESSAGE]).is.a('string');
      done();
    });

    logger.log('info', 'Some super awesome log message', meta);
  });

  it('.log(level, formatStr, ...splat)', done => {
    const format = winston.format.combine(
      winston.format.splat(),
      winston.format.printf(info => `${info.level}: ${info.message}`)
    );

    const logger = helpers.createLogger(info => {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('100% such wow {"much":"javascript"}');
      assume(info.splat).deep.equals([100, 'wow', { much: 'javascript' }]);
      assume(info[MESSAGE]).equals('info: 100% such wow {"much":"javascript"}');
      done();
    }, format);

    logger.log('info', '%d%% such %s %j', 100, 'wow', { much: 'javascript' });
  });

  it('.log(level, formatStr, ...splat, meta)', done => {
    const format = winston.format.combine(
      winston.format.splat(),
      winston.format.printf(info => `${info.level}: ${info.message} ${JSON.stringify(info.meta)}`)
    );

    const logger = helpers.createLogger(info => {
      assume(info).is.an('object');
      assume(info.level).equals('info');
      assume(info.message).equals('100% such wow {"much":"javascript"}');
      assume(info.splat).deep.equals([100, 'wow', { much: 'javascript' }]);
      assume(info.meta).deep.equals({ thisIsMeta: true });
      assume(info[MESSAGE]).equals('info: 100% such wow {"much":"javascript"} {"thisIsMeta":true}');
      done();
    }, format);

    logger.log('info', '%d%% such %s %j', 100, 'wow', { much: 'javascript' }, { thisIsMeta: true });
  });

  it('.cli() throws', () =>  {
    const logger = winston.createLogger();
    assume(logger.cli).throws(/Use a custom/);
  });
});
