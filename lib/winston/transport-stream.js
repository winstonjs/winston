'use strict';

var stream = require('stream'),
    util = require('util');

var TransportStream = module.exports = function TransportStream(opts) {
  stream.Writable.call(this, { objectMode: true });
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
  if (!this.listeners('error').length) {
    this.on('error', onError);
  }

  //
  // Get the levels from the source we are piped from.
  //
  this.once('pipe', function (logger) {
    self.levels = logger.levels;
    self.level = self.level || logger.level;
  });

  //
  // If and/or when the transport is removed from this instance
  //
  this.once('unpipe', function (src) {
    if (src === self) {
      self.removeListener('error', onError);
      //
      // Remark: this may not be the desired implementation since
      // a single transport may be shared by multiple Logger
      // instances.
      //
      if (self.close) {
        self.close();
      }
    }
  });
};

util.inherits(TransportStream, stream.Writable);

/*
 * @private function _write(info)
 * Writes the info object to our transport instance.
 */
TransportStream.prototype._write = function (info, enc, callback) {
  //
  // Remark: This has to be handled in the base transport now because we cannot
  // conditionally write to our pipe targets as stream.
  //
  if (!this.level || this.levels[this.level] <= this.levels[info.level]) {
    self.log(info);
  }

  callback();
};
