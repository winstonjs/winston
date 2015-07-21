'use strict';

var stream = require('stream'),
    util = require('util'),
    TransportStream = require('./transports/transport-stream');

var LogStream = module.exports = function LogStream (options) {
  stream.Transform.call(this, { objectMode: true });

  options = options || {};
  options.format = options.format || require('./formats/default');

  //
  // Hoist other options onto this instance.
  //
  this.level = options.level || 'info';
  this.exitOnError = typeof options.exitOnError !== 'undefined'
    ? options.exitOnError
    : true;

  if (options.transports) {
    options.transports.forEach(function (transport) {
      self.add(transport);

      //
      // TODO: Figure out what we want to do with this.
      //
      // if (transport.handleExceptions) {
      //   handleExceptions = true;
      // }
    });
  }

  //
  // TODO: Figure out what we want to do with this.
  //
  // if (options.exceptionHandlers) {
  //   handleExceptions = true;
  //   options.exceptionHandlers.forEach(function (handler) {
  //     self._hnames.push(handler.name);
  //     self.exceptionHandlers[handler.name] = handler;
  //   });
  // }
  //
  // if (options.handleExceptions || handleExceptions) {
  //   this.handleExceptions();
  // }
}

util.inherits(LogStream, stream.Transform);

/*
 * @private function _write (obj)
 * Emits data so that it can be picked up by all of
 * our pipe targets.
 */
LogStream.prototype._write = function (info) {
  //
  // Remark: really not sure what to do here, but this has been
  // reported as very confusing by pre winston@2.0.0 users as
  // quite confusing when using custom levels.
  //
  if (!this.levels[info.level]) {
    console.error('Unknown logger level: %s', info.level);
  }

  //
  // TODO: How do we get the result of the `info` when written
  // to `this.format` NOT `info` itself? Maybe duplexify?
  //
  // https://github.com/mafintosh/duplexify
  //
  if (this.levels[this.level] <= this.levels[info.level]) {
    this.emit('data', info);
  }
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
};

/*
 * function add (transport)
 * Adds the transport to this logger instance by
 * piping to it.
 */
LogStream.prototype.add = function (transport) {
  var self = this;
  var target;

  //
  // Support backwards compatibility with all existing
  // `winston@1.x.x` transport.
  //
  if (transport.objectMode) {
    target = new TransportStream({ transport: transport });
  }
  else {
    //
    // TODO: Support `format` in `TransportStream` backwards
    // compatibility.
    //
    target = new LegacyTransportStream({ transport: transport });
  }

  //
  // Listen for the `error` event on the new Transport
  //
  target.on('error', onError);
  this.pipe(transport);

  //
  // TODO: Re-implement handle exceptions options
  //
};

/*
 * function remove (transport)
 * Removes the transport from this logger instance by
 * unpiping from it.
 */
LogStream.prototype.remove = function (transport) {
  this.unpipe(transport);
};

/*
 * function clear (transport)
 * Removes all transports from this logger instance.
 */
LogStream.prototype.clear = function () {
  this.unpipe();
};

/*
 * ### function close ()
 * Cleans up resources (streams, event listeners) for all
 * transports associated with this instance (if necessary).
 */
Logger.prototype.close = function () {
  var self = this;

  this._readableState.pipes.forEach(function (transport) {
    if (transport && transport.close) {
      transport.close();
    }
  });

  this.emit('close');
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
