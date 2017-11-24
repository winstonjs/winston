'use strict';

const stream = require('stream');
const util = require('util');

/*
 * Constructor function for the ExceptionStream responsible for wrapping
 * a TransportStream; only allowing writes of `info` objects with `info.exception`
 * set to true.
 *
 * @param  {TransportStream} Stream to filter to exceptions
 */
var ExceptionStream = module.exports = function ExceptionStream(transport) {
  if (!transport) {
    throw new Error('ExceptionStream requires a TransportStream instance.');
  }

  stream.Writable.call(this, { objectMode: true });

  //
  // Remark (indexzero): we set `handleExceptions` here because it's the
  // predicate checked in ExceptionHandler.prototype.__getExceptionHandlers
  //
  this.handleExceptions = true;
  this.transport = transport;
};

util.inherits(ExceptionStream, stream.Writable);

/*
 * @private function _write(info)
 * Writes the info object to our transport instance if (and only if)
 * the `exception` property is set on the info.
 */
ExceptionStream.prototype._write = function (info, enc, callback) {
  if (info.exception) {
    return this.transport.log(info, callback);
  }

  callback();
  return true;
};
