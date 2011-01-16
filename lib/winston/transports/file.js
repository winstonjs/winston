/*
 * file.js: Transport for outputting to a local log file
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    fs = require('fs'),
    colors = require('colors'),
    log = require('./../utils').log;
    
var File = exports.File = function (stream, options) {
  options = options || {}
  
  this.stream = typeof stream === 'string' 
                ? fs.createWriteStream(stream, options.options || {})
                : this.stream = stream;
  
  // TODO: Consume the colorize option
  this.silent = options.silent || false;
  this.colorize = options.colorize;
};

File.prototype.log = function (level, msg, meta, callback) {
  if (!this.silent) {
    var output = log(level, msg, meta) + '\n';
    this.stream.write(output);
    callback(null, true);
  }
};