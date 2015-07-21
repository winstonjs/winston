'use strict';

var stream = require('stream'),
    util = require('util');

var TransportStream = module.exports = function TransportStream(opts) {
  stream.Writable.call(this, { objectMode: true });
  this.transport = opts.transport;
  this.format = opts.format;

  var onError = this.emit.bind(this, 'error');
  var self = this;

  //
  // Remark: this may still be too naive, but we create a new
  // bound function each time so the Object references are
  // technically different. In this way it's not possible to:
  //
  //    if (transport.listeners('error').indexof(this._onError))
  //
  // This really has to do with how Container instances may share
  // a single transport instance.
  //
  if (!this.transport.listeners('error').length) {
    this.transport.on('error', onError);
  }

  //
  // If and/or when the transport is removed from this instance
  //
  this.once('unpipe', function (src) {
    if (src === self) {
      self.transport.removeListener('error', onError);
      //
      // Remark: this may not be the desired implementation since
      // a single transport may be shared by multiple Logger
      // instances.
      //
      if (self.transport.close) {
        self.transport.close();
      }
    }
  });
};

util.inherits(TransportStream, stream.Writable);

/*
 * @private function _write(info)
 * Writes the info object to our transport instance.
 */
TransportStream.prototype._write = function (info) {
  //
  // Remark: This has to be handled in the base transport now because we cannot
  // conditionally write to our pipe targets as stream.
  //
  // TODO: Check `info.level` against `this.level`.
  //
  transport.log(info);
};
