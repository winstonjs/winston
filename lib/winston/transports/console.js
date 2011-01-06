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
  options = options || {};
  
  // TODO: Consume the colorize option
  this.silent = options.silent || false;
  this.colorize = options.colorize;
};

Console.prototype.log = function (level, msg, meta, callback) {
  if (!this.silent) {
    if (level === 'debug') {
      util.debug(msg);
    }
    else if (level === 'error') {
      util.error(level + ': ' + msg);
    }
    else {
      util.puts(level + ': ' + msg);
    }

    // TODO: Define color profile for eyes
    if (meta && Object.keys(meta).length > 0) eyes.inspect(meta);
  }
  
  callback(null, true);
};