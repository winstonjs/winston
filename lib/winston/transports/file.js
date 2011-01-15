/*
 * file.js: Transport for outputting to a local log file
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    fs = require('fs'),
    colors = require('colors');
    
var File = exports.File = function (filename, options) {
  
};

File.prototype.log = function (level, msg, meta, callback) {
  
};