'use strict';

var util = require('util'),
    format = require('./format');

/*
 * function simple (opts)
 * Returns a new instance of the simple format TransformStream
 * which writes a simple representation of logs.
 *
 *    ${info.level}: ${info.message} ${JSON.stringify(info)}
 */
module.exports = format(function (info, opts) {
  info.raw = util.format('%s: %s %j', info.level, info.message, info);
  return info;
});
