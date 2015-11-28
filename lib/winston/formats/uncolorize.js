'use strict';

var format = require('./format');

/*
 * function uncolorize (opts)
 * Returns a new instance of the uncolorize format TransformStream
 * which strips colors from `info` objects. This was previously
 * exposed as the `stripColors` option to transports in `winston < 3.0.0`.
 */
module.exports = format(function (info, opts) {
  throw new Error('Not implemented.');
});
