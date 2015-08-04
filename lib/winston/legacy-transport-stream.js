'use strict';

var util = require('util'),
    TransportStream = require('./transport-stream')

var LegacyTransportStream = module.exports = function LegacyTransportStream(opts) {
  TransportStream.call(this, opts);

  //
  // TODO: Do things slightly differently for Legacy transports because we need to unhook
  // the TRANSPORTS events, not the TransportStream.
  //
  this.transport = opts.transport;
  console.log('%s is a Legacy winston transport. Consider upgrading', opts.transport.name)
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
