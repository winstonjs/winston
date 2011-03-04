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
    config = require('./../config');

//
// function setLevels (target, past, current)
//   Create functions on the target objects for each level 
//   in current.levels. If past is defined, remove functions
//   for each of those levels.
//
var setLevels = exports.setLevels = function (target, past, current, isDefault) {
  if (past) {
    Object.keys(past).forEach(function (level) {
      delete target[level];
    });
  }

  target.levels = current || config.npm.levels;
  
  if (target.padLevels) {
    target.levelLength = longestElement(Object.keys(target.levels));
  }
  
  //
  //  Define prototype methods for each log level
  //  e.g. target.log('info', msg) <=> target.info(msg)
  //
  Object.keys(target.levels).forEach(function (level) {
    target[level] = function (msg) {
      var args = Array.prototype.slice.call(arguments),
          callback = typeof args[args.length - 1] === 'function' || args.length === 3 ? args.pop() : null,
          meta = args.length === 2 ? args.pop() : null;

      return target.log(level, msg, meta, callback);
    };
  });
  
  return target;
};

var longestElement = exports.longestElement = function (a) {
  var l = 0;
  for (var i = 0; i < a.length; i++) {
    if (a[l].length < a[i].length) {
      l = i;
    }
  }
  
  return a[l].length;
}

//
// function clone (obj)
//   Helper method for deep cloning pure JSON objects
//   i.e. JSON objects that are either literals or objects (no Arrays, etc)
//
var clone = exports.clone = function (obj) {
  var clone = {};
  for (var i in obj) {
    clone[i] = obj[i] instanceof Object ? exports.clone(obj[i]) : obj[i];
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
var log = exports.log = function (level, msg, meta, options) {
  var output = options.timestamp ? timestamp() + ' - ' : '';
      targetLevel = options.colorize ? config.colorize(level) : level;
      
  output += targetLevel + ': ' + msg;
  
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