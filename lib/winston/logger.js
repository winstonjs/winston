/**
 * logger.js: TODO: add file header description.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

const stream = require('stream');
const asyncForEach = require('async/forEach');
const { LEVEL } = require('triple-beam');
const isStream = require('is-stream');
const ExceptionHandler = require('./exception-handler');
const LegacyTransportStream = require('winston-transport/legacy');
const Profiler = require('./profiler');
const { clone, escapedPercent, formatRegExp, warn } = require('./common');
const config = require('./config');

/**
 * TODO: add class description.
 * @type {Logger}
 * @extends {stream.Transform}
 */
class Logger extends stream.Transform {
  /**
   * Constructor function for the Logger object responsible for persisting log
   * messages and metadata to one or more transports.
   * @param {!Object} options - foo
   */
  constructor(options) {
    super({
      objectMode: true
    });
    this.configure(options);
  }

  /**
   * This will wholesale reconfigure this instance by:
   * 1. Resetting all transports. Older transports will be removed implicitly.
   * 2. Set all other options including levels, colors, rewriters, filters,
   *    exceptionHandlers, etc.
   * @param {!Object} options - TODO: add param description.
   * @returns {undefined}
   */
  configure({
    silent,
    format,
    levels,
    level = 'info',
    exitOnError = true,
    transports,
    colors,
    emitErrs,
    formatters,
    padLevels,
    rewriters,
    stripColors,
    exceptionHandlers
  } = {}) {
    // Reset transports if we already have them
    if (this.transports.length) {
      this.clear();
    }

    this.silent = silent;
    this.format = format || this.format || require('logform/json')();

    levels = levels || this.levels || config.npm.levels;
    const maxLength = Math.max(...Object.keys(levels).map(lev => lev.length));

    this.paddings = Object.keys(levels).reduce((acc, lev) => {
      const pad = lev.length !== maxLength
        ? new Array(maxLength - lev.length + 1).join(' ')
        : '';

      acc[lev] = pad;
      return acc;
    }, {});

    // Hoist other options onto this instance.
    this.levels = levels;
    this.level = level;
    this.exceptions = new ExceptionHandler(this);
    this.profilers = {};
    this.exitOnError = exitOnError;

    // Add all transports we have been provided.
    if (transports) {
      transports = Array.isArray(transports) ? transports : [transports];
      transports.forEach(transport => this.add(transport));
    }

    if (
      colors || emitErrs || formatters ||
      padLevels || rewriters || stripColors
    ) {
      throw new Error([
        '{ colors, emitErrs, formatters, padLevels, rewriters, stripColors } were removed in winston@3.0.0.',
        'Use a custom winston.format(function) instead.',
        'See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md'
      ].join('\n'));
    }

    if (exceptionHandlers) {
      this.exceptions.handle(exceptionHandlers);
    }
  }

  /**
   * Ensure backwards compatibility with a `log` method
   * @param {mixed} level - TODO: add param description.
   * @param {mixed} msg - TODO: add param description.
   * @param {mixed} meta - TODO: add param description.
   * @returns {Logger} - TODO: add return description.
   *
   * @example
   *    // Supports the existing API, which is now DEPRECATED:
   *    logger.log('info', 'Hello world', { custom: true });
   *    logger.log('info', new Error('Yo, it\'s on fire'));
   *    logger.log('info', '%s %d%%', 'A string', 50, { thisIsMeta: true });
   *
   *    // And the new API with a single JSON literal:
   *    logger.log({ level: 'info', message: 'Hello world', custom: true });
   *    logger.log({ level: 'info', message: new Error('Yo, it\'s on fire') });
   *    logger.log({
   *      level: 'info',
   *      message: '%s %d%%',
   *      splat: ['A string', 50],
   *      meta: { thisIsMeta: true }
   *    });
   */
  // log(level, msg, meta) {
  log(...args) {
    const [level, msg, meta] = args;
    // Optimize for the hotpath of logging JSON literals
    if (args.length === 1) {
      // Yo dawg, I heard you like levels ... seriously ...
      // In this context the LHS `level` here is actually the `info` so read
      // this as: info[LEVEL] = info.level;
      level[LEVEL] = level.level;
      this.write(level);
      return this;
    }

    // Slightly less hotpath, but worth optimizing for.
    if (args.length === 2) {
      if (msg && typeof msg === 'object') {
        msg[LEVEL] = msg.level = level;
        this.write(msg);
        return this;
      }

      this.write({ [LEVEL]: level, level, message: msg });
      return this;
    }

    // Separation of the splat from { level, message, meta } must be done at
    // this point in the objectMode stream since we only ever write a single
    // object.
    const tokens = msg && msg.match && msg.match(formatRegExp);
    if (tokens) {
      this._splat({
        [LEVEL]: level,
        level,
        message: msg
      }, tokens, args.slice(2));
      return this;
    }

    const info = Object.assign({}, meta, {
      [LEVEL]: level,
      level,
      message: msg
    });
    this.write(info);
    return this;
  }

  /**
   * Pushes data so that it can be picked up by all of our pipe targets.
   * @param {mixed} info - TODO: add param description.
   * @param {mixed} enc - TODO: add param description.
   * @param {mixed} callback - TODO: add param description.
   * @returns {undefined}
   * @private
   */
  _transform(info, enc, callback) {
    if (this.silent) {
      return callback();
    }

    // [LEVEL] is only soft guaranteed to be set here since we are a proper
    // stream. It is likely that `info` came in through `.log(info)` or
    // `.info(info)`. If it is not defined, however, define it.
    // This LEVEL symbol is provided by `triple-beam` and also used in:
    // - logform
    // - winston-transport
    // - abstract-winston-transport
    if (!info[LEVEL]) {
      info[LEVEL] = info.level;
    }

    // Remark: really not sure what to do here, but this has been reported as
    // very confusing by pre winston@2.0.0 users as quite confusing when using
    // custom levels.
    if (!this.levels[info[LEVEL]] && this.levels[info[LEVEL]] !== 0) {
      // eslint-disable-next-line no-console
      console.error('[winston] Unknown logger level: %s', info[LEVEL]);
    }

    // Remark: not sure if we should simply error here.
    if (!this._readableState.pipes) {
      // eslint-disable-next-line no-console
      console.error('[winston] Attempt to write logs with no transports %j', info);
    }

    // Here we write to the `format` pipe-chain, which on `readable` above will
    // push the formatted `info` Object onto the buffer for this instance.
    this.push(this.format.transform(info, this.format.options));
    callback();
  }

  /**
   * Check to see if tokens <= splat.length, assign { splat, meta } into the
   * `info` accordingly, and write to this instance.
   * @param {mixed} info - TODO: add param description.
   * @param {mixed} tokens - TODO: add param description.
   * @param {mixed} splat - TODO: add param description.
   * @returns {undefined}
   * @private
   */
  _splat(info, tokens, splat) {
    const percents = info.message.match(escapedPercent);
    const escapes = percents && percents.length || 0;

    // The expected splat is the number of tokens minus the number of escapes
    // e.g.
    // - { expectedSplat: 3 } '%d %s %j'
    // - { expectedSplat: 5 } '[%s] %d%% %d%% %s %j'
    //
    // Any "meta" will be arugments in addition to the expected splat size
    // regardless of type. e.g.
    //
    // logger.log('info', '%d%% %s %j', 100, 'wow', { such: 'js' }, { thisIsMeta: true });
    // would result in splat of four (4), but only three (3) are expected. Therefore:
    //
    // extraSplat = 3 - 4 = -1
    // metas = [100, 'wow', { such: 'js' }, { thisIsMeta: true }].splice(-1, -1 * -1);
    // splat = [100, 'wow', { such: 'js' }]
    const expectedSplat = tokens.length - escapes;
    const extraSplat = expectedSplat - splat.length;
    const metas = extraSplat < 0
      ? splat.splice(extraSplat, -1 * extraSplat)
      : [];

    // Now that { splat } has been separated from any potential { meta }. we
    // can assign this to the `info` object and write it to our format stream.
    info.splat = splat;
    if (metas.length) {
      info.meta = metas[0];
    }

    this.write(info);
  }

  /**
   * Adds the transport to this logger instance by piping to it.
   * @param {mixed} transport - TODO: add param description.
   * @returns {Logger} - TODO: add return description.
   */
  add(transport) {
    // Support backwards compatibility with all existing `winston@1.x.x`
    // transport. All NEW transports should inherit from
    // `winston.TransportStream`.
    const target = !isStream(transport)
      ? new LegacyTransportStream({ transport })
      : transport;

    if (!target._writableState || !target._writableState.objectMode) {
      throw new Error('Transports must WritableStreams in objectMode. Set { objectMode: true }.');
    }

    // Listen for the `error` event on the new Transport.
    this._onError(target);
    this.pipe(target);

    if (transport.handleExceptions) {
      this.exceptions.handle();
    }

    return this;
  }

  /**
   * Removes the transport from this logger instance by unpiping from it.
   * @param {mixed} transport - TODO: add param description.
   * @returns {Logger} - TODO: add return description.
   */
  remove(transport) {
    let target = transport;
    if (!isStream(transport)) {
      target = this.transports
        .filter(match => match.transport === transport)[0];
    }

    if (target) { this.unpipe(target); }
    return this;
  }

  /**
   * Removes all transports from this logger instance.
   * @returns {Logger} - TODO: add return description.
   */
  clear() {
    this.unpipe();
    return this;
  }

  /**
   * Cleans up resources (streams, event listeners) for all transports
   * associated with this instance (if necessary).
   * @returns {Logger} - TODO: add return description.
   */
  close() {
    this.clear();
    this.emit('close');
    return this;
  }

  /**
   * Sets the `target` levels specified on this instance.
   * @param {Object} Target levels to use on this instance.
   */
  setLevels() {
    warn.deprecated('setLevels');
  }

  /**
   * Queries the all transports for this instance with the specified `options`.
   * This will aggregate each transport's results into one object containing
   * a property per transport.
   * @param {Object} options - Query options for this instance.
   * @param {function} callback - Continuation to respond to when complete.
   * @retruns {mixed} - TODO: add return description.
   */
  query(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = options || {};
    const results = {};
    const queryObject = clone(options.query) || {};

    // Helper function to query a single transport
    function queryTransport(transport, next) {
      if (options.query) {
        options.query = transport.formatQuery(queryObject);
      }

      transport.query(options, (err, res) => {
        if (err) {
          return next(err);
        }

        next(null, transport.formatResults(res, options.format));
      });
    }

    // Helper function to accumulate the results from `queryTransport` into
    // the `results`.
    function addResults(transport, next) {
      queryTransport(transport, (err, result) => {
        // queryTransport could potentially invoke the callback multiple times
        // since Transport code can be unpredictable.
        if (next) {
          result = err || result;
          if (result) {
            results[transport.name] = result;
          }

          // eslint-disable-next-line callback-return
          next();
        }

        next = null;
      });
    }

    // Iterate over the transports in parallel setting the appropriate key in
    // the `results`.
    asyncForEach(
      this.transports.filter(transport => !!transport.query),
      addResults,
      () => callback(null, results)
    );
  }

  /**
   * Returns a log stream for all transports. Options object is optional.
   * @param{Object} options={} - Stream options for this instance.
   * @returns {Stream} - TODO: add return description.
   */
  stream(options = {}) {
    const out = new stream.Stream();
    const streams = [];

    out._streams = streams;
    out.destroy = () => {
      let i = streams.length;
      while (i--) {
        streams[i].destroy();
      }
    };

    // Create a list of all transports for this instance.
    this.transports
      .filter(transport => !!transport.stream)
      .forEach(transport => {
        const str = transport.stream(options);
        if (!str) {
          return;
        }

        streams.push(str);

        str.on('log', log => {
          log.transport = log.transport || [];
          log.transport.push(transport.name);
          out.emit('log', log);
        });

        str.on('error', err => {
          err.transport = err.transport || [];
          err.transport.push(transport.name);
          out.emit('error', err);
        });
      });

    return out;
  }

  /**
   * Returns an object corresponding to a specific timing. When done is called
   * the timer will finish and log the duration. e.g.:
   * @returns {Profile} - TODO: add return description.
   * @example
   *    const timer = winston.startTimer()
   *    setTimeout(() => {
   *      timer.done({
   *        message: 'Logging message'
   *      });
   *    }, 1000);
   */
  startTimer() {
    return new Profiler(this);
  }

  /**
   * Tracks the time inbetween subsequent calls to this method with the same
   * `id` parameter. The second call to this method will log the difference in
   * milliseconds along with the message.
   * @param {string} id Unique id of the profiler
   * @returns {Logger} - TODO: add return description.
   */
  profile(id, ...args) {
    const time = Date.now();
    if (this.profilers[id]) {
      const timeEnd = this.profilers[id];
      delete this.profilers[id];

      // Attempt to be kind to users if they are still using older APIs.
      if (typeof args[args.length - 2] === 'function') {
        // eslint-disable-next-line no-console
        console.warn('Callback function no longer supported as of winston@3.0.0');
        args.pop();
      }

      // Set the duration property of the metadata
      const info = typeof args[args.length - 1] === 'object' ? args.pop() : {};
      info.level = info.level || 'info';
      info.durationMs = time - timeEnd;
      info.message = info.message || id;
      return this.write(info);
    }

    this.profilers[id] = time;
    return this;
  }

  /**
   * Backwards compatibility to `exceptions.handle` in winston < 3.0.0.
   * @returns {undefined}
   * @deprecated
   */
  handleExceptions(...args) {
    // eslint-disable-next-line no-console
    console.warn('Deprecated: .handleExceptions() will be removed in winston@4. Use .exceptions.handle()');
    this.exceptions.handle(...args);
  }

  /**
   * Backwards compatibility to `exceptions.handle` in winston < 3.0.0.
   * @returns {undefined}
   * @deprecated
   */
  unhandleExceptions(...args) {
    // eslint-disable-next-line no-console
    console.warn('Deprecated: .unhandleExceptions() will be removed in winston@4. Use .unexceptions.handle()');
    this.exceptions.unhandle(...args);
  }

  /**
   * Throw a more meaningful deprecation notice
   * @throws {Error} - TODO: add throws description.
   */
  cli() {
    throw new Error([
      'Logger.cli() was removed in winston@3.0.0',
      'Use a custom winston.formats.cli() instead.',
      'See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md'
    ].join('\n'));
  }

  /**
   * Bubbles the error, `err`, that occured on the specified `transport` up
   * from this instance if `emitErrs` has been set.
   * @param {Object} transport - Transport on which the error occured
   * @throws {Error} - Error that occurred on the transport
   * @private
   */
  _onError(transport) {
    function transportError(err) {
      this.emit('error', err, transport);
    }

    if (!transport.__winstonError) {
      transport.__winstonError = transportError.bind(this);
      transport.on('error', transport.__winstonError);
    }
  }
}

/**
 * Represents the current readableState pipe targets for this Logger instance.
 * @type {Array|Object}
 */
Object.defineProperty(Logger.prototype, 'transports', {
  configurable: false,
  enumerable: true,
  get() {
    const { pipes } = this._readableState;
    return !Array.isArray(pipes) ? [pipes].filter(Boolean) : pipes;
  }
});

module.exports = Logger;
