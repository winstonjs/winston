'use strict';

var util = require('util'),
    TransportStream = require('./transport-stream')

var LegacyTransportStream = module.exports = function LegacyTransportStream(opts) {
  TransportStream.call(this, opts);
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
  // TODO: Check `info.level` against `this.level`.
  // TODO: Perform transformations based on this.transform;
  //
  transport.log(info.level, info.message, info);
};
