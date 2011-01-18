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
    
//
// function File (options)
//   Constructor for the File transport object.
//
var File = exports.File = function (options) {
  options = options || {}
  
  if (options.filename) this.stream = fs.createWriteStream(options.filename, options.options || {});
  else if (options.stream) this.stream = options.stream;
  else throw new Error('Cannot log to file without filename or stream.');
    
  // TODO: Consume the colorize option
  this.name = 'file';
  this.level = options.level || 'info';
  this.silent = options.silent || false;
  this.colorize = options.colorize;
};

//
// function log (level, msg, [meta], callback)
//   Core logging method exposed to Winston. Metadata is optional.
//
File.prototype.log = function (level, msg, meta, callback) {
  if (!this.silent) {
    var output = log(level, msg, meta) + '\n';
    this.stream.write(output);
    callback(null, true);
  }
};