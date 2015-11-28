'use strict';

var colors = require('colors/safe'),
    format = require('./format');

/*
 * function uncolorize (opts)
 * Returns a new instance of the uncolorize format TransformStream
 * which strips colors from `info` objects. This was previously
 * exposed as the `stripColors` option to transports in `winston < 3.0.0`.
 */
module.exports = format(function (info, opts) {
  info.level = colors.strip(info.level);
  info.message = colors.strip(info.message);

  if (info.raw) {
    info.raw = colors.strip(info.raw);
  }

  return info;
});
