'use strict';

const { once } = require('events');
const { Writable } = require('stream');
const { LEVEL, MESSAGE } = require('triple-beam');
const winston = require('../../../lib/winston');

describe('Logger filterBeforeFormat', function () {
  let loggers;
  let streams;

  beforeEach(function () {
    loggers = [];
    streams = [];
  });

  afterEach(function () {
    loggers.forEach(logger => {
      logger.close();
      logger.destroy();
    });
    streams.forEach(stream => stream.destroy());
    jest.restoreAllMocks();
  });

  function createTransport(options = {}) {
    const transport = new winston.transports.Console(options);
    // Keep the real transport filtering; replace only console I/O.
    transport.log = jest.fn((info, callback) => callback());
    streams.push(transport);
    return transport;
  }

  function createLogger(options = {}) {
    const transport = createTransport();
    const transform = jest.fn(info => info);
    const logger = winston.createLogger({
      format: winston.format.combine(
        winston.format(transform)(),
        winston.format.label({ label: 'example' }),
        winston.format.json()
      ),
      transports: [transport],
      ...options
    });
    loggers.push(logger);
    return { logger, transport, transform };
  }

  it.each([false, true])('filters formatting and readable output only when enabled (%s)', async enabled => {
    const { logger, transport, transform } = createLogger(enabled ? { filterBeforeFormat: true } : {});
    const records = [];
    logger.on('data', info => records.push(info.message));
    logger.debug('filtered');
    logger.info('visible');
    await new Promise(setImmediate);
    expect(transform).toHaveBeenCalledTimes(enabled ? 1 : 2);
    expect(transport.log).toHaveBeenCalledTimes(1);
    expect(records).toEqual(enabled ? ['visible'] : ['filtered', 'visible']);
  });

  const entryPoints = [
    ['log(level, message)', (logger, level) => logger.log(level, 'message')],
    ['write(info)', (logger, level) => logger.write({ level, message: 'message' })],
    ['child', (logger, level) => logger.child({ request: 123 })[level]('message')]
  ];

  it.each(entryPoints)('skips rejected formatting through %s', (name, log) => {
    const { logger, transport, transform } = createLogger({ filterBeforeFormat: true });
    log(logger, 'debug');
    log(logger, 'info');
    expect(transform).toHaveBeenCalledTimes(1);
    expect(transport.log).toHaveBeenCalledTimes(1);
    expect(transport.log.mock.calls[0][0]).toMatchObject({
      level: 'info', message: 'message', label: 'example', [LEVEL]: 'info'
    });
    expect(JSON.parse(transport.log.mock.calls[0][0][MESSAGE])).toMatchObject({
      level: 'info', message: 'message', label: 'example'
    });
  });

  it.each([
    ['debug', 'info', 0, 0],
    [null, 'debug', 1, 1],
    ['invalid', null, 1, 0]
  ])('respects parent %s and transport %s thresholds', (level, transportLevel, formatted, emitted) => {
    const { logger, transport, transform } = createLogger({ filterBeforeFormat: true, level });
    transport.level = transportLevel;
    logger.debug('message');
    expect(transform).toHaveBeenCalledTimes(formatted);
    expect(transport.log).toHaveBeenCalledTimes(emitted);
  });

  it('supports custom level priorities', function () {
    const { logger, transport, transform } = createLogger({
      filterBeforeFormat: true, levels: { urgent: 0, normal: 1, detail: 2 }, level: 'normal'
    });
    logger.detail('filtered');
    logger.urgent('visible');
    expect(transform).toHaveBeenCalledTimes(1);
    expect(transport.log.mock.calls[0][0][LEVEL]).toBe('urgent');
  });

  it('checks every transport and responds to changing thresholds and transports', function () {
    const { logger, transport, transform } = createLogger({ filterBeforeFormat: true });
    const other = createTransport({ level: 'debug' });
    logger.add(other);
    logger.debug('visible on other');
    logger.remove(other);
    logger.debug('filtered');
    transport.level = 'debug';
    logger.debug('visible on original');
    delete transport.level;
    logger.level = 'debug';
    logger.debug('visible via parent');
    expect(transform).toHaveBeenCalledTimes(3);
    expect(other.log).toHaveBeenCalledTimes(1);
    expect(transport.log).toHaveBeenCalledTimes(2);
  });

  it('preserves unknown-level diagnostics and formatting', function () {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { logger, transform } = createLogger({ filterBeforeFormat: true });
    logger.log('unknown', 'message');
    expect(error).toHaveBeenCalledWith('[winston] Unknown logger level: %s', 'unknown');
    expect(transform).toHaveBeenCalledTimes(1);
  });

  it('can be enabled and resets to the default on reconfiguration', function () {
    const { logger, transform } = createLogger();
    logger.configure({ filterBeforeFormat: true, transports: [createTransport()] });
    logger.debug('filtered');
    expect(transform).not.toHaveBeenCalled();
    logger.configure({ transports: [createTransport()] });
    logger.debug('formatted');
    expect(logger.filterBeforeFormat).toBe(false);
    expect(transform).toHaveBeenCalledTimes(1);
  });

  it('keeps no-transport buffering for a transport added later', async function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { logger, transform } = createLogger({ filterBeforeFormat: true, transports: [] });
    logger.debug('buffered');
    const transport = createTransport({ level: 'debug' });
    logger.add(transport);
    await new Promise(setImmediate);
    expect(transform).toHaveBeenCalledTimes(1);
    expect(transport.log.mock.calls[0][0].message).toBe('buffered');
  });

  it.each(['exception', 'rejection'])('formats marked %s records even without handler streams', kind => {
    const { logger, transform } = createLogger({ filterBeforeFormat: true });
    logger.log({ level: 'debug', message: 'marked', [kind]: true });
    expect(transform).toHaveBeenCalledTimes(1);
  });

  it('preserves a custom transport that accepts otherwise rejected levels', function () {
    const { logger, transport, transform } = createLogger({ filterBeforeFormat: true });
    transport._write = function (info, enc, callback) { this.log(info, callback); };
    logger.debug('accepted by the custom transport');
    expect(transform).toHaveBeenCalledTimes(1);
    expect(transport.log).toHaveBeenCalledTimes(1);
  });

  it('does not prefilter a generic piped stream', async function () {
    const { logger, transform } = createLogger({ filterBeforeFormat: true });
    const records = [];
    const stream = new Writable({
      objectMode: true,
      write(info, enc, callback) { records.push(info); callback(); }
    });
    streams.push(stream);
    logger.pipe(stream);
    logger.debug('visible to the stream');
    await new Promise(setImmediate);
    expect(transform).toHaveBeenCalledTimes(1);
    expect(records[0].message).toBe('visible to the stream');
  });

  it('calls write callbacks and finishes after rejected records', async function () {
    const { logger } = createLogger({ filterBeforeFormat: true });
    const callback = jest.fn();
    const finished = once(logger, 'finish');
    logger.write({ level: 'debug', message: 'filtered' }, callback);
    logger.end();
    await finished;
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('releases the write callback if a transport level getter throws', function () {
    const { logger, transport } = createLogger({ filterBeforeFormat: true });
    const failure = new Error('level lookup failed');
    Object.defineProperty(transport, 'level', {
      configurable: true,
      get() { throw failure; }
    });
    expect(() => logger.info('fails')).toThrow(failure);
    delete transport.level;
    logger.info('still visible');
    expect(transport.log).toHaveBeenCalledTimes(1);
  });
});
