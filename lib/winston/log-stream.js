'use strict';

var stream = require('stream'),
    util = require('util'),
    format = util.format,
    ExceptionHandler = require('./exception-handler'),
    TransportStream = require('./transport-stream'),
    LegacyTransportStream = require('./legacy-transport-stream'),
    isStream = require('isstream'),
    common = require('./common');

var LogStream = module.exports = function LogStream (options) {
  var self = this;
  stream.Transform.call(this, { objectMode: true });
  this.configure(options);
};

//
// Inherit from `stream.Transform`.
//
util.inherits(LogStream, stream.Transform);

/*
 * ### function configure (options)
 * This will wholesale reconfigure this instance by:
 * 1. Resetting all transports. Older transports will be removed implicitly.
 * 2. Set all other options including levels, colors, rewriters, filters,
 *    exceptionHandlers, etc.
 */
LogStream.prototype.configure = function (options) {
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
  this.format = options.format || this.format || require('./formats/default')();

  //
  // Hoist other options onto this instance.
  //
  this.setLevels(options.levels);
  this.level = options.level || 'info';
  this.exceptions = new ExceptionHandler(this);
  this.exitOnError = typeof options.exitOnError !== 'undefined'
    ? options.exitOnError
    : true;

  if (options.transports) {
    options.transports.forEach(function (transport) {
      this.add(transport);
    }, this);
  }

  if (options.colors || options.emitErrs || options.formatters 
    || options.padLevels || options.rewriters || options.stripColors) {
    //
    // TODO: Link to UPGRADE.md guide
    //
    throw new Error([
      '{ colors, emitErrs, formatters, padLevels, rewriters, stripColors } were removed in winston@3.0.0.',
      'Use a custom winston.format(function) instead.'
    ].join('\n'));
  }

  if (options.exceptionHandlers) {
    this.handleExceptions(options.exceptionHandlers);
  }
};

/*
 * @property {Array} Represents the current readableState
 * pipe targets for this LogStream instance.
 */
Object.defineProperty(LogStream.prototype, 'transports', {
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
Object.defineProperty(LogStream.prototype, 'format', {
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
    // in `LogStream.prototype._transform`
    //
    var self = this;

    //
    // Keep a reference to our readable function
    // so that we can remove the listener later.
    //
    this._onReadableFormat = function () {
      var info;
      while (null !== (info = self.format.read())) {
        self.push(info);
      }
    };

    this._format = fmt;
    this._format.on('readable', this._onReadableFormat);
  }
});

/*
 * Sets the `target` levels specified on this instance.
 * @param {Object} Target levels to use on this instance.
 */
LogStream.prototype.setLevels = function (target) {
  // TODO: Should we remove this?
  common.setLevels(this, this.levels, target);
  return this;
};

/*
 * @private function _transform (obj)
 * Pushes data so that it can be picked up by all of
 * our pipe targets.
 */
LogStream.prototype._transform = function (info, enc, callback) {
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
  // TODO: How do we handle TransportStream instances with their
  // own format? We probably need two pipe chains here.
  //
  this.format.write(info);
  callback();
};

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
LogStream.prototype.log = function (level, msg, meta) {
  //
  // TODO: Check to see if arguments.length > 1 and
  // if the string provided has any %% in it.
  //
  if (arguments.length === 1) {
    return this.write(level);
  }

  //
  // Alternative implementation
  //
  // this.write({
  //   level: level,
  //   message: msg,
  //   meta: meta
  // });

  meta = meta || {};
  meta.level = level;
  meta.message = msg;
  this.write(meta);
  return this;
};

/*
 * function add (transport)
 * Adds the transport to this logger instance by
 * piping to it.
 */
LogStream.prototype.add = function (transport) {
  var self = this;

  //
  // Support backwards compatibility with all existing
  // `winston@1.x.x` transport. All NEW transports should
  // inherit from `winston.TransportStream`.
  //
  // TODO: Support `format` in `TransportStream` backwards
  // compatibility.
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

  //
  // TODO: Re-implement handle exceptions options
  //
  return this;
};

/*
 * function remove (transport)
 * Removes the transport from this logger instance by
 * unpiping from it.
 */
LogStream.prototype.remove = function (transport) {
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
LogStream.prototype.clear = function () {
  this.unpipe();
  return this;
};

/*
 * ### function close ()
 * Cleans up resources (streams, event listeners) for all
 * transports associated with this instance (if necessary).
 */
LogStream.prototype.close = function () {
  this.clear();
  this.emit('close');
  return this;
};

/*
 * Throw a more meaningful deprecation notice
 */
LogStream.prototype.cli = function () {
  console.warn('Use a custom winston.format(function) instead.');
  throw new Error('Logger.cli() was removed in winston@3.0.0');
  // TODO: Link to UPGRADE.md guide
};

//
// Some things stay the same
//
LogStream.prototype.query = function () {
  // More or less the same as winston@1.0.0
};

LogStream.prototype.stream = function () {
  // More or less the same as winston@1.0.0
};

//
// ### @private function _onError (transport)
// #### @transport {Object} Transport on which the error occured
// #### @err {Error} Error that occurred on the transport
// Bubbles the error, `err`, that occured on the specified `transport`
// up from this instance if `emitErrs` has been set.
//
LogStream.prototype._onError = function (transport) {
  var self = this;

  function transportError(err) {
    self.emit('error', err, transport);
  }

  if (!transport.__winstonError) {
    transport.__winstonError = transportError;
    transport.on('error', transport.__winstonError);
  }
};
