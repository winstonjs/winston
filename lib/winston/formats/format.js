'use strict';

var stream = require('stream'),
    util = require('util');

/*
 * function format (formatFn)
 * Returns a create function for the `formatFn`.
 */
module.exports = function (formatFn) {
  if (arguments.length === 1) {
    return createFormat(formatFn);
  }

  // Remark: a little awkward that multiple formats is automagically created
  // for you, but it feels correct w.r.t. current API designs.
  const formats = Array.prototype.slice.call(arguments);
  return createFormat(cascade(formats))();
};

/*
 * Creates a wrapped format from a single `formatFn`.
 */
function createFormat(formatFn) {
  if (formatFn.length > 2) {
    throw new Error(`Format functions must be synchronous taking a two arguments: (info, opts)\n${formatFn.toString()}`);
  }

  //
  // Create a wrapper Prototype of `Format` which
  // has the `formatFn` set to `_format`.
  //
  function FormatWrap(opts) { Format.call(this, opts); }
  util.inherits(FormatWrap, Format);
  FormatWrap.prototype.transform = formatFn;

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
}

/*
 * function Format (options)
 * Base prototype which calls a `_format`
 * function and pushes the result.
 */
function Format(options) {
  this.options = options || {};
};

/*
 * function cascade(formats)
 * Returns a function that invokes the `._format` function in-order
 * for the specified set of `formats`. In this manner we say that Formats
 * are "pipe-like", but not a pure pumpify implementation. Since there is no back
 * pressure we can remove all of the "readable" plumbing in Node streams.
 */
function cascade(formats) {
  return function cascaded(info, opts) {
    for (var i = 0; i < formats.length; i++) {
      formats[i].transform(info, formats[i].options);
    }

    return info;
  };
}
