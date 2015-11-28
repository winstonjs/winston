'use strict';

var inspect = require('util').inspect,
    format = require('./format');

/*
 * function prettyPrint (opts)
 * Returns a new instance of the prettyPrint format TransformStream
 * with "prettyPrint" serializes `info` objects. This was previously
 * exposed as the `prettyPrint` option to transports in `winston < 3.0.0`.
 */
module.exports = format(function (info, opts) {
  info.raw = inspect(info, false, opts.depth || null, opts.colorize);
  return info;
});
