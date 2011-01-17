/*
 * console.js: Transport for outputting to the console
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    colors = require('colors'),
    log = require('./../utils').log;

//
// function Console (options)
//   Constructor for the Console transport object.
//
var Console = exports.Console = function (options) {
  options = options || {};
  
  // TODO: Consume the colorize option
  this.name = 'console';
  this.silent = options.silent || false;
  this.colorize = options.colorize;
};

//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
Console.prototype.log = function (level, msg, meta, callback) {
  if (!this.silent) {
    var output = log(level, msg, meta);
    
    if (level === 'error' || level === 'debug') {
      util.error(output);
    }
    else {
      util.puts(output);
    }
  }
  
  callback(null, true);
};