'use strict';

var format = require('./format');

/*
 * function cli (opts)
 * Returns a new instance of the CLI format TransformStream
 * with turns a log `info` object into the same format
 * previously available in `winston.cli()` in `winston < 3.0.0`.
 */
module.exports = format(function (info, opts) {
  throw new Error('Not implemented.');
});
