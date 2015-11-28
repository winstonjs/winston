'use strict';

var stream = require('stream'),
    util = require('util'),
    format = util.format,
    async = require('async'),
    isStream = require('isstream'),
    TransportStream = require('winston-transport'),
    ExceptionHandler = require('./exception-handler'),
    LegacyTransportStream = require('winston-transport/legacy'),
    Profiler = require('./profiler'),
    common = require('./common');

const formatRegExp = /%[sdj%]/g;

/*
 * Constructor function for the Logger object responsible
 * for persisting log messages and metadata to one or more transports.
 */
var Logger = module.exports = function Logger(options) {
  var self = this;
  stream.Transform.call(this, { objectMode: true });
  this.configure(options);
};

//
// Inherit from `stream.Transform`.
//
util.inherits(Logger, stream.Transform);

/*
 * ### function configure (options)
 * This will wholesale reconfigure this instance by:
 * 1. Resetting all transports. Older transports will be removed implicitly.
 * 2. Set all other options including levels, colors, rewriters, filters,
 *    exceptionHandlers, etc.
 */
Logger.prototype.configure = function (options) {
  //
  // Reset transports if we already have them
  //
  if (this.transports.length) {
    this.clear();
  }

  //
  // TODO: What happens if someone overwrites the format
  // and then adds another TransportStream?
  //
  options = options || {};
  this.format = options.format || this.format || require('./formats/json')();

  //
  // Hoist other options onto this instance.
  //
  this.setLevels(options.levels);
  this.level = options.level || 'info';
  this.exceptions = new ExceptionHandler(this);
  this.profilers = {};
  this.exitOnError = typeof options.exitOnError !== 'undefined'
    ? options.exitOnError
    : true;

  //
  // Add all transports we have been provided.
  //
  if (options.transports) {
    options.transports.forEach(function (transport) {
      this.add(transport);
    }, this);
  }

  if (options.colors || options.emitErrs || options.formatters 
    || options.padLevels || options.rewriters || options.stripColors) {
    throw new Error([
      '{ colors, emitErrs, formatters, padLevels, rewriters, stripColors } were removed in winston@3.0.0.',
      'Use a custom winston.format(function) instead.',
      'See: https://github.com/winstonjs/winston/tree/master/UPGRADING.md'
    ].join('\n'));
  }

  if (options.exceptionHandlers) {
    this.exceptions.handle(options.exceptionHandlers);
  }
};

/*
 * @property {Array} Represents the current readableState
 * pipe targets for this Logger instance.
 */
Object.defineProperty(Logger.prototype, 'transports', {
  configurable: false,
  enumerable: true,
  get: function () {
    var pipes = this._readableState.pipes;
    return !Array.isArray(pipes)
      ? [pipes].filter(Boolean)
      : pipes;
  }
});

/*
 * @property {Format} Current format associate with this instance.
 * Handling this as a getter / setter allows us to implicitly
 * remove the `readable` events on the format.
 */
Object.defineProperty(Logger.prototype, 'format', {
  configurable: false,
  enumerable: true,
  get: function () {
    return this._format;
  },
  set: function (fmt) {
    if (this._format === fmt) {
      //
      // No-op on `stream.format = stream.format;`
      //
      return;
    } else if (this._format) {
      //
      // If there has already been a format attached to this
      // instance then remove our listener for `readable`
      //
      this._format.removeListener('readable', this._onReadableFormat);
    }

    //
    // Listen to `readable` events on the format and then
    // write those transformed `info` Objects onto
    // the buffer for this instance.
    //
    // The original `info` Objects are written to the format
    // in `Logger.prototype._transform`
    //
    var self = this;

    //
    // Keep a reference to our readable function
    // so that we can remove the listener later.
    //
    this._onReadableFormat = function () {
      var info;
      while (null !== (info = self._format.read())) {
        self.push(info);
      }
    };

    this._format = fmt;
    this._format.on('readable', this._onReadableFormat);
  }
});

/*
 * function log (level, msg, meta)
 * function log (info)
 * Ensure backwards compatibility with a `log` method
 *
 * Supports the existing API, which is now DEPRECATED:
 *
 *    logger.log('info', 'Hello world', { custom: true });
 *
 * And the new API with a single JSON literal:
 *
 *    logger.log({ level: 'info', message: 'Hello world', custom: true });
 *
 * @api deprecated
 */
Logger.prototype.log = function (level, msg, meta) {
  //
  // TODO: Check to see if arguments.length > 1 and
  // if the string provided has any %% in it.
  //
  if (arguments.length === 1) {
    return this.write(level);
  }

  meta = meta || {};
  meta.level = level;
  meta.message = msg;
  this.write(meta);
  return this;
};

/*
 * @private function _transform (obj)
 * Pushes data so that it can be picked up by all of
 * our pipe targets.
 */
Logger.prototype._transform = function (info, enc, callback) {
  //
  // Remark: really not sure what to do here, but this has been
  // reported as very confusing by pre winston@2.0.0 users as
  // quite confusing when using custom levels.
  //
  if (!this.levels[info.level] && this.levels[info.level] !== 0) {
    console.error('Unknown logger level: %s', info.level);
  }

  //
  // Here we write to the `format` pipe-chain, which
  // on `readable` above will push the formatted `info`
  // Object onto the buffer for this instance.
  //
  this._format.write(info);
  callback();
};

/*
 * function add (transport)
 * Adds the transport to this logger instance by
 * piping to it.
 */
Logger.prototype.add = function (transport) {
  var self = this;

  //
  // Support backwards compatibility with all existing
  // `winston@1.x.x` transport. All NEW transports should
  // inherit from `winston.TransportStream`.
  //
  var target = !isStream(transport)
    ? new LegacyTransportStream({ transport: transport })
    : transport

  if (!target._writableState || !target._writableState.objectMode) {
    throw new Error('Transports must WritableStreams in objectMode. Set { objectMode: true }.');
  }

  //
  // Listen for the `error` event on the new Transport
  //
  this._onError(target);
  this.pipe(target);

  if (transport.handleExceptions) {
    this.exceptions.handle();
  }

  return this;
};

/*
 * function remove (transport)
 * Removes the transport from this logger instance by
 * unpiping from it.
 */
Logger.prototype.remove = function (transport) {
  var target = transport;
  if (!isStream(transport)) {
    target = this.transports.filter((match) => {
      return match.transport === transport;
    })[0];
  }

  if (target) { this.unpipe(target); }
  return this;
};

/*
 * function clear (transport)
 * Removes all transports from this logger instance.
 */
Logger.prototype.clear = function () {
  this.unpipe();
  return this;
};

/*
 * ### function close ()
 * Cleans up resources (streams, event listeners) for all
 * transports associated with this instance (if necessary).
 */
Logger.prototype.close = function () {
  this.clear();
  this.emit('close');
  return this;
};

/*
 * Sets the `target` levels specified on this instance.
 * @param {Object} Target levels to use on this instance.
 */
Logger.prototype.setLevels = function (target) {
  common.setLevels(this, this.levels, target);
  return this;
};

//
// ### function query (options, callback)
// #### @options {Object} Query options for this instance.
// #### @callback {function} Continuation to respond to when complete.
// Queries the all transports for this instance with the specified `options`.
// This will aggregate each transport's results into one object containing
// a property per transport.
//
Logger.prototype.query = function (options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var self = this,
      options = options || {},
      results = {},
      query = common.clone(options.query) || {},
      transports;

  //
  // Helper function to query a single transport
  //
  function queryTransport(transport, next) {
    if (options.query) {
      options.query = transport.formatQuery(query);
    }

    transport.query(options, function (err, results) {
      if (err) {
        return next(err);
      }

      next(null, transport.formatResults(results, options.format));
    });
  }

  //
  // Helper function to accumulate the results from
  // `queryTransport` into the `results`.
  //
  function addResults(transport, next) {
    queryTransport(transport, function (err, result) {
      //
      // queryTransport could potentially invoke the callback
      // multiple times since Transport code can be unpredictable.
      //
      if (next) {
        result = err || result;
        if (result) {
          results[transport.name] = result;
        }

        next();
      }

      next = null;
    });
  }

  //
  // Iterate over the transports in parallel setting the
  // appropriate key in the `results`
  //
  async.forEach(this.transports.filter(function (transport) {
    return !!transport.query;
  }), addResults, function () {
    callback(null, results);
  });
};

//
// ### function stream (options)
// #### @options {Object} Stream options for this instance.
// Returns a log stream for all transports. Options object is optional.
//
Logger.prototype.stream = function (options) {
  options = options || {};

  var self = this,
      out = new stream.Stream(),
      streams = [];

  out._streams = streams;
  out.destroy = function () {
    var i = streams.length;
    while (i--) streams[i].destroy();
  };

  //
  // Create a list of all transports for this instance.
  //
  this.transports.filter(function (transport) {
    return !!transport.stream;
  }).forEach(function (transport) {
    var stream = transport.stream(options);
    if (!stream) return;

    streams.push(stream);

    stream.on('log', function (log) {
      log.transport = log.transport || [];
      log.transport.push(transport.name);
      out.emit('log', log);
    });

    stream.on('error', function (err) {
      err.transport = err.transport || [];
      err.transport.push(transport.name);
      out.emit('error', err);
    });
  });

  return out;
};

//
// ### function startTimer ()
// Returns an object corresponding to a specific timing. When done
// is called the timer will finish and log the duration. e.g.:
//
//    timer = winston.startTimer()
//    setTimeout(function(){
//      timer.done({ message: 'Logging message' });
//    }, 1000);
//
Logger.prototype.startTimer = function () {
  return new Profiler(this);
};

//
// ### function profile (id, [info])
// @param {string} id Unique id of the profiler
// Tracks the time inbetween subsequent calls to this method
// with the same `id` parameter. The second call to this method
// will log the difference in milliseconds along with the message.
//
Logger.prototype.profile = function (id) {
  var time = Date.now(),
      timeEnd,
      info,
      args;

  if (this.profilers[id]) {
    timeEnd = this.profilers[id];
    delete this.profilers[id];

    //
    // Attempt to be kind to users if they are still
    // using older APIs.
    //
    args = Array.prototype.slice.call(arguments, 1);
    if (typeof args[args.length - 1] === 'function') {
      console.warn('Callback function no longer supported as of winston@3.0.0');
      args.pop();
    }

    //
    // Set the duration property of the metadata
    //
    info = typeof args[args.length - 1] === 'object' ? args.pop() : {};
    info.level = info.level || 'info';
    info.durationMs = time - timeEnd;
    info.message = info.message || id;
    return this.log(info);
  }

  this.profilers[id] = time;
  return this;
};

/*
 * Backwards compatibility to `exceptions.handle`
 * in winston < 3.0.0.
 *
 * @api deprecated
 */
Logger.prototype.handleExceptions = function () {
  console.warn('Deprecated: .handleExceptions() will be removed in winston@4. Use .exceptions.handle()');
  var args = Array.prototype.slice.call(arguments);
  this.exceptions.handle.apply(this.exceptions, args);
};

/*
 * Backwards compatibility to `exceptions.handle`
 * in winston < 3.0.0.
 *
 * @api deprecated
 */
Logger.prototype.unhandleExceptions = function () {
  console.warn('Deprecated: .unhandleExceptions() will be removed in winston@4. Use .unexceptions.handle()');
  var args = Array.prototype.slice.call(arguments);
  this.exceptions.unhandle.apply(this.exceptions, args);
};

/*
 * Throw a more meaningful deprecation notice
 */
Logger.prototype.cli = function () {
  throw new Error([
    'Logger.cli() was removed in winston@3.0.0',
    'Use a custom winston.formats.cli() instead.',
    'See: https://github.com/winstonjs/winston/tree/master/UPGRADING.md'
  ].join('\n'));
};

//
// ### @private function _onError (transport)
// #### @transport {Object} Transport on which the error occured
// #### @err {Error} Error that occurred on the transport
// Bubbles the error, `err`, that occured on the specified `transport`
// up from this instance if `emitErrs` has been set.
//
Logger.prototype._onError = function (transport) {
  var self = this;

  function transportError(err) {
    self.emit('error', err, transport);
  }

  if (!transport.__winstonError) {
    transport.__winstonError = transportError;
    transport.on('error', transport.__winstonError);
  }
};
