'use strict';

var config = require('../config'),
    format = require('./format');

/*
 * function colorize (opts)
 * Returns a new instance of the CLI format TransformStream
 * with applies level colors to `info` objects.
 */
module.exports = format(function (info, opts) {
  var level = info.leve;
  info.level = config.colorize(level);
  if (opts.all) {
    info.message = config.colorize(level, info.message);
  }

  return info;
});
