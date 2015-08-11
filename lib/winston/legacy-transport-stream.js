'use strict';

var util = require('util'),
    TransportStream = require('./transport-stream')

var LegacyTransportStream = module.exports = function LegacyTransportStream(opts) {
  opts = opts || {};
  opts.objectMode = true;

  TransportStream.call(this, opts);

  //
  // TODO: Do things slightly differently for Legacy transports because we need to unhook
  // the TRANSPORTS events, not the TransportStream.
  //
  this.transport = opts.transport;
  console.error('%s is a Legacy winston transport. Consider upgrading', opts.transport.name);

  //
  // Properly bubble up errors from the transport to the LegacyTransportStream
  // instance, but only once no matter how many times this transport is shared.
  //
  function transportError(err) {
    self.emit('error', err, self.transport);
  }

  if (!this.transport.__winstonError) {
    this.transport.__winstonError = transportError;
    this.transport.on('error', this.transport.__winstonError);
  }
};

util.inherits(LegacyTransportStream, TransportStream);

/*
 * @private function _write(info)
 * Writes the info object to our transport instance.
 */
LegacyTransportStream.prototype._write = function (info) {
  //
  // Remark: This has to be handled in the base transport now because we cannot
  // conditionally write to our pipe targets as stream.
  //
  // TODO: Perform transformations based on this.format;
  //
  if (!this.transport.level || this.levels[transport.level] <= this.levels[info.level]) {
    this.transport.log(info.level, info.message, info);
  }
};

/*
 * Clean up error handling state on the legacy transport associated
 * with this instance.
 */
LegacyTransportStream.prototype.close = function () {
  if (this.transport.__winstonError) {
    this.transport.removeListener('error', this.transport.__winstonError);
  }
};
