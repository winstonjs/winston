'use strict';

var stream = require('stream'),
    util = require('util');

/*
 * function format (formatFn)
 * Returns a create function for the `formatFn`.
 */
module.exports = function (formatFn) {
  if (formatFn.length > 2) {
    throw new Error('Format functions must be synchronous taking a two arguments: (info, opts)');
  }

  //
  // Create a wrapper Prototype of `Format` which
  // has the `formatFn` set to `_format`.
  //
  function FormatWrap(opts) { Format.call(this, opts); }
  util.inherits(FormatWrap, Format);
  FormatWrap.prototype._format = formatFn;

  //
  // Create a function which returns new instances of
  // FormatWrap for simple syntax like:
  //
  // require('winston').formats.json();
  //
  function createFormatWrap(opts) {
    return new FormatWrap(opts);
  }

  //
  // Expose the FormatWrap through the create function
  // for testability.
  //
  createFormatWrap.Format = FormatWrap;
  return createFormatWrap;
};

/*
 * function Format (options)
 * Base TransformStream which calls a `_format`
 * function and pushes the result.
 */
function Format(options) {
  stream.Transform.call(this, { objectMode: true });
  this.options = options || {};
};

util.inherits(Format, stream.Transform);

/*
 * @private function _transform (info, enc, cb)
 * Always push the result of the `_format` function
 * onto the readable data for this instance.
 */
Format.prototype._transform = function (info, enc, cb) {
  this.push(this._format(info, this.options));
  cb();
};
