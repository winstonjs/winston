/*
 * index.js: Top-level include for Winston
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var util = require('util'),
    crypto = require('crypto'),
    qs = require('querystring'),
    levels = require('./../levels');

//
// function clone (obj)
//   Helper method for deep cloning pure JSON objects
//   i.e. JSON objects that are either literals or objects (no Arrays, etc)
//
var clone = exports.clone = function (obj) {
  var clone = {};
  for (var i in obj) {
    clone[i] = obj[i] instanceof Object ? interns.clone(obj[i]) : obj[i];
  }

  return clone;
};

var months = ['Jan', 'Feb', 'Mar', 'Apr', 
              'May', 'Jun', 'Jul', 'Aug', 
              'Sep', 'Oct', 'Nov', 'Dec'];

//
// Borrowed from node.js core because I wanted a universal lowercase header message
//
var pad = exports.pad = function (n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

//
// Borrowed from node.js core because I wanted a universal lowercase header message
//
var timestamp = exports.timestamp = function () {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

//
// function log (level, msg, meta)
//   Generic logging function for returning timestamped strings
//
var log = exports.log = function (level, msg, meta, colorize) {
  var output = timestamp() + ' - ';
      targetLevel = colorize ? levels.colorize(level) : level;
      
  output += targetLevel + ': ' + msg;
  
  // TODO: Define color profile for eyes
  if (meta && Object.keys(meta).length > 0) output += ' ' + qs.unescape(qs.stringify(meta, ','));
  
  return output;
}

//
// function hash (str)
//   Utility function for creating unique ids
//   e.g. Profiling incoming HTTP requests on the same tick
//
var hash = exports.hash = function (str) {
  return crypto.createHash('sha1').update(str).digest('hex');
};