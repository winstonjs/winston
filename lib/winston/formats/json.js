'use strict';

/*
 * function json (opts)
 * Returns a new instance of the JSON format TransformStream
 * with turns a log `info` object into pure JSON.
 */
module.exports = require('./format').create(function (info, opts) {
  //
  // TODO: How do we handle "encoding transitions" like this?
  // We are breaking the objectMode contract by returning a string.
  // e.g. we could return an Object with a "raw" property.
  //
  // return { raw: JSON.stringify(info, opts.replacer, opts.space) }
  //

  return JSON.stringify(info, opts.replacer || replacer, opts.space);
});

/*
 * function replacer (key, value)
 * Handles proper stringification of Buffer output.
 */
function replacer(key, value) {
  return value instanceof Buffer
    ? value.toString('base64')
    : value;
}
