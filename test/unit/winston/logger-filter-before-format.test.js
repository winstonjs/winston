'use strict';

const { EventEmitter, once } = require('events');
const { Writable } = require('stream');
const { LEVEL, MESSAGE } = require('triple-beam');
const TransportStream = require('winston-transport');
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

  it.each([{}, { filterBeforeFormat: false }])('preserves formatting by default (%j)', options => {
    const { logger, transport, transform } = createLogger(options);
    logger.debug('filtered');
    logger.info('visible');
    expect(transform).toHaveBeenCalledTimes(2);
    expect(transport.log).toHaveBeenCalledTimes(1);
  });

  const entryPoints = [
    ['level method', (logger, level) => logger[level]('message')],
    ['log(level, message)', (logger, level) => logger.log(level, 'message')],
    ['log(info)', (logger, level) => logger.log({ level, message: 'message' })],
    ['metadata', (logger, level) => logger.log(level, 'message', { request: 123 })],
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

  it('keeps child metadata and string interpolation', function () {
    const { logger, transport } = createLogger({
      filterBeforeFormat: true,
      defaultMeta: { service: 'example' },
      format: winston.format.combine(winston.format.splat(), winston.format.json())
    });
    logger.child({ request: 123 }).info('message %s', 'value');
    expect(transport.log.mock.calls[0][0]).toMatchObject({
      message: 'message value', service: 'example', request: 123
    });
  });

  it('uses the normalized LEVEL symbol rather than the display level', function () {
    const { logger, transport } = createLogger({ filterBeforeFormat: true });
    logger.write({ level: 'debug', [LEVEL]: 'info', message: 'visible' });
    expect(transport.log).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['info', 'debug', 1, 1],
    ['debug', 'info', 0, 0],
    [null, 'debug', 1, 1],
    ['invalid', 'debug', 1, 1],
    [null, null, 1, 1],
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

  it('uses the transport level map, including changes after piping', function () {
    const { logger, transport, transform } = createLogger({ filterBeforeFormat: true });
    transport.levels = { debug: 0, info: 1 };
    logger.debug('visible');
    expect(transform).toHaveBeenCalledTimes(1);
    expect(transport.log).toHaveBeenCalledTimes(1);
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

  it.each(['exception', 'rejection'])('preserves %s handler routing', kind => {
    const { logger, transform } = createLogger({
      filterBeforeFormat: true, levels: { fatal: 0, error: 1 }, level: 'fatal'
    });
    const handler = createTransport({ level: 'fatal' });
    logger[kind === 'exception' ? 'exceptions' : 'rejections'].handle(handler);
    logger.log({ level: 'error', message: 'handler record', [kind]: true });
    expect(transform).toHaveBeenCalledTimes(1);
    expect(handler.log).toHaveBeenCalledTimes(1);
  });

  it.each(['exception', 'rejection'])('formats marked %s records even without handler streams', kind => {
    const { logger, transform } = createLogger({ filterBeforeFormat: true });
    logger.log({ level: 'debug', message: 'marked', [kind]: true });
    expect(transform).toHaveBeenCalledTimes(1);
  });

  it.each(['write', '_write', '_writev', '_accept'])('falls back for an overridden transport %s', method => {
    const { logger, transport, transform } = createLogger({ filterBeforeFormat: true });
    const original = TransportStream.prototype[method];
    transport[method] = function (...args) { return original.apply(this, args); };
    logger.debug('filtered by the transport');
    expect(transform).toHaveBeenCalledTimes(1);
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

  it('does not prefilter a legacy transport', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { logger, transform } = createLogger({ filterBeforeFormat: true });
    const legacy = new EventEmitter();
    legacy.level = 'debug';
    legacy.log = jest.fn(function (level, message, meta, callback) { callback(); });
    logger.add(legacy);
    logger.debug('legacy record');
    expect(transform).toHaveBeenCalledTimes(1);
    expect(legacy.log).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('explicitly filters the readable output when enabled (%s)', async enabled => {
    const { logger } = createLogger({ filterBeforeFormat: enabled });
    const records = [];
    logger.on('data', info => records.push(info));
    logger.debug('filtered');
    logger.info('visible');
    await new Promise(setImmediate);
    expect(records.map(info => info.message)).toEqual(enabled ? ['visible'] : ['filtered', 'visible']);
  });

  it('keeps logger and transport silent behavior', function () {
    const { logger, transport, transform } = createLogger({ filterBeforeFormat: true, silent: true });
    logger.info('silent logger');
    expect(transform).not.toHaveBeenCalled();
    logger.silent = false;
    transport.silent = true;
    logger.info('silent transport');
    expect(transform).toHaveBeenCalledTimes(1);
    expect(transport.log).not.toHaveBeenCalled();
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

  it('preserves accepted record backpressure and finish', async function () {
    const { logger, transport, transform } = createLogger({ filterBeforeFormat: true });
    let release;
    transport.log.mockImplementationOnce((info, callback) => { release = callback; });
    const messages = [];
    let writable = true;
    for (let i = 0; i < 100 && writable; i++) {
      logger.debug('filtered');
      messages.push(String(i));
      writable = logger.write({ level: 'info', message: String(i) });
    }
    expect(writable).toBe(false);
    const drained = once(logger, 'drain');
    release();
    await drained;
    const finished = once(logger, 'finish');
    logger.end();
    await finished;
    expect(transform).toHaveBeenCalledTimes(messages.length);
    expect(transport.log.mock.calls.map(([info]) => info.message)).toEqual(messages);
  });

  it('preserves formatter errors and continues processing later writes', function () {
    const { logger, transform, transport } = createLogger({ filterBeforeFormat: true });
    const failure = new Error('format failed');
    transform.mockImplementationOnce(() => { throw failure; });
    expect(() => logger.debug('filtered')).not.toThrow();
    expect(() => logger.info('fails')).toThrow(failure);
    logger.info('still visible');
    expect(transport.log.mock.calls[0][0].message).toBe('still visible');
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

  it('preserves transport error propagation', function () {
    const { logger, transport } = createLogger({ filterBeforeFormat: true });
    const onError = jest.fn();
    logger.on('error', onError);
    const failure = new Error('transport failed');
    transport.log.mockImplementation((info, callback) => callback(failure));
    logger.info('accepted');
    expect(onError).toHaveBeenCalledWith(failure, transport);
  });
});
