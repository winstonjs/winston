/*
 * console.js: Transport for outputting to the console
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    eyes = require('eyes'),
    colors = require('colors');

var Console = exports.Console = function (options) {
  // TODO: Consume the colorize option
  this.colorize = options.colorize;
};

Console.prototype.log = function (level, msg, meta, callback) {
  if (level !== 'error') {
    util.debug(level + ': ' + msg);
  }
  else {
    util.error(msg);
  }
  
  if (meta && Object.keys(meta).length > 0) eyes.inspect(meta);
  callback(null, true);
};