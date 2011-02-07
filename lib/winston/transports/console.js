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
  
  this.name = 'console';
  this.level = options.level || 'info';
  this.silent = options.silent || false;
  this.colorize = options.colorize || false;
  this.timestamp = options.timestamp || true;
};

//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
Console.prototype.log = function (level, msg, meta, callback) {
  if (!this.silent) {
    var output = log(level, msg, meta, {
      colorize: this.colorize, 
      timestamp: this.timestamp
    });
    
    if (level === 'error' || level === 'debug') {
      util.error(output);
    }
    else {
      util.puts(output);
    }
  }
  
  callback(null, true);
};