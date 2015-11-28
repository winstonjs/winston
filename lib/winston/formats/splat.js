'use strict';

var format = require('./format');

/*
 * function splat (opts)
 * Returns a new instance of the splat format TransformStream
 * which performs string interpolation from `info` objects. This was
 * previously exposed implicitly in `winston < 3.0.0`.
 */
module.exports = format(function (info, opts) {
  throw new Error('Not implemented.');
});
