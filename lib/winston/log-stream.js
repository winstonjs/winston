var stream = require('stream'),
    util = require('util');

function LogStream (options) {
  stream.Transform.call(this, { objectMode: true });

  options = options || {};
  options.format = options.format || require('./default-format');
}

util.inherits(LogStream, stream.Transform);

/*
 * Ensure backwards compatibility with a `log` method
 */
LogStream.prototype.log = function (level, msg, meta) {
  if (arguments.length === 1) {
    return this.write(level);
  }

  this.write({
    level: level,
    message: msg,
    meta: meta
  });
};

LogStream.prototype.add = function (transport) {
  transport.format = transport.format || this.format;
  this.pipe(transport);
};

LogStream.prototype.remove = function (transport) {
  this.unpipe(transport);
};

//
// ### function close ()
// Cleans up resources (streams, event listeners) for all
// transports associated with this instance (if necessary).
//
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
